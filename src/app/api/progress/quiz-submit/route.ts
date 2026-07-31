import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getItemLock } from '@/lib/progress';
import { logActivity } from '@/lib/activity-log';
import { broadcast } from '@/lib/realtime';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { itemId, answers } = (await req.json()) as {
    itemId: string;
    answers: { questionId: string; selectedIndex: number; correct: boolean }[];
  };
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { section: { include: { module: true } } },
  });
  if (!item) return Response.json({ error: 'item_not_found' }, { status: 404 });

  const lock = await getItemLock(user.id, itemId);
  if (lock.locked) return Response.json({ error: 'item_locked', reason: lock.reason }, { status: 403 });

  // 1. Load all questions for this item
  const questions = await prisma.question.findMany({
    where: { topicId: item.section.questionBankId ?? '' },
  });
  if (questions.length === 0) {
    return Response.json({ error: 'no_questions' }, { status: 400 });
  }

  // 2. Load invalidations for this user
  const invalidations = await prisma.questionInvalidation.findMany({
    where: { userId: user.id, itemId },
  });
  const invalidationMap = new Map(invalidations.map((i) => [i.questionId, true]));

  // 3. Grade
  let correct = 0;
  let needsReAnswer = false;
  const detailedAnswers: {
    questionId: string;
    selectedIndex?: number;
    correct: boolean;
    invalidated: boolean;
  }[] = [];

  for (const q of questions) {
    const submitted = answers.find((a) => a.questionId === q.id);
    const selectedIndex = submitted?.selectedIndex;
    const options = q.options as { text: string; correct: boolean }[];
    const correctIndex = options.findIndex((o) => o.correct);
    const isCorrect = selectedIndex === correctIndex;
    const isInvalidated = invalidationMap.has(q.id);

    if (isInvalidated) {
      if (selectedIndex === undefined) {
        needsReAnswer = true;
      }
    } else if (isCorrect) {
      correct++;
    }

    detailedAnswers.push({
      questionId: q.id,
      selectedIndex,
      correct: isCorrect,
      invalidated: isInvalidated,
    });
  }

  const effectiveTotal = questions.filter((q) => !invalidationMap.has(q.id)).length;
  const passed = correct >= item.quizPassThreshold && !needsReAnswer;
  const scoreFailed = correct < item.quizPassThreshold;

  // 4. Persist attempt
  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      itemId,
      answers: detailedAnswers,
      invalidations: Array.from(invalidationMap.entries()).map(([qid]) => qid),
      score: correct,
      total: effectiveTotal,
      passed,
    },
  });

  // 5. Update topic progress
  await prisma.topicProgress.upsert({
    where: { userId_itemId: { userId: user.id, itemId } },
    create: {
      userId: user.id,
      itemId,
      quizScore: correct,
      quizTotal: effectiveTotal,
      quizCompleted: passed,
      completedAt: passed ? new Date() : null,
    },
    update: {
      quizScore: correct,
      quizTotal: effectiveTotal,
      quizCompleted: passed,
      completedAt: passed ? new Date() : null,
    },
  });

  // 6. If the score fails the pass criteria, reset the section video so the
  //    student must re-watch it from the start before retaking the quiz.
  let redirectTo: string | null = null;
  if (scoreFailed) {
    const sectionItems = await prisma.item.findMany({
      where: { sectionId: item.sectionId },
      orderBy: { order: 'asc' },
    });
    const videoItem = sectionItems.find((i) => i.type === 'VIDEO');
    if (videoItem) {
      await prisma.topicProgress.upsert({
        where: { userId_itemId: { userId: user.id, itemId: videoItem.id } },
        create: {
          userId: user.id,
          itemId: videoItem.id,
          videoCompleted: false,
          videoWatchedSeconds: 0,
        },
        update: {
          videoCompleted: false,
          videoWatchedSeconds: 0,
          completedAt: null,
        },
      });
      redirectTo = `/learn/${item.section.module.courseId}/${item.section.module.id}/${item.sectionId}/${videoItem.id}`;
    }
  }

  // 7. If all 3 items in section complete, mark section done
  if (passed) {
    const sectionItems = await prisma.item.findMany({ where: { sectionId: item.sectionId } });
    const allProgress = await prisma.topicProgress.findMany({
      where: { userId: user.id, itemId: { in: sectionItems.map((i) => i.id) } },
    });
    const allDone = sectionItems.every((si) => {
      const p = allProgress.find((ap) => ap.itemId === si.id);
      if (si.type === 'VIDEO') return p?.videoCompleted;
      if (si.type === 'ACTIVITY') return p?.activityCompleted;
      return p?.quizCompleted;
    });
    if (allDone) {
      await prisma.moduleProgress.upsert({
        where: { userId_moduleId: { userId: user.id, moduleId: item.section.module.id } },
        create: {
          userId: user.id,
          moduleId: item.section.module.id,
          allItemsDone: true,
          completedAt: new Date(),
        },
        update: {
          allItemsDone: true,
          completedAt: new Date(),
        },
      });
      await logActivity({
        type: 'module_progress.complete',
        userId: user.id,
        actorId: user.id,
        actorRole: 'STUDENT',
        targetType: 'Module',
        targetId: item.section.module.id,
        metadata: { score: correct, total: effectiveTotal },
      });
      await broadcast(`user-${user.id}`, 'module-complete', {
        moduleId: item.section.module.id,
        score: correct,
        total: effectiveTotal,
      });
    }
  }

  await logActivity({
    type: passed ? 'quiz.pass' : 'quiz.fail',
    userId: user.id,
    actorId: user.id,
    actorRole: 'STUDENT',
    targetType: 'Item',
    targetId: itemId,
    severity: passed ? 'info' : 'warn',
    metadata: { correct, total: effectiveTotal, needsReAnswer },
  });

  return Response.json({ correct, total: effectiveTotal, passed, needsReAnswer, redirectTo });
}

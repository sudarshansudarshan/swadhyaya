import { NextRequest } from 'next/server';
import { requirePermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { broadcast } from '@/lib/realtime';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await requirePermission('students.cancel_question');
  const body = await req.json();
  const { userId, questionId, itemId, reason } = body;

  if (!userId || !questionId || !itemId) {
    return Response.json({ error: 'missing_params' }, { status: 400 });
  }

  const actorId = user.isAdmin ? user.id : (await prisma.instructor.findUnique({ where: { userId: user.id } }))?.id ?? user.id;
  const actorType = user.isAdmin ? 'ADMIN' : 'INSTRUCTOR';

  const invalidation = await prisma.questionInvalidation.upsert({
    where: {
      userId_questionId_itemId: { userId, questionId, itemId },
    },
    create: {
      userId,
      questionId,
      itemId,
      invalidatedById: actorId,
      invalidatedByType: actorType,
      reason: reason ?? null,
    },
    update: {
      reason: reason ?? null,
    },
  });

  // Force re-quiz: mark topic progress as incomplete
  await prisma.topicProgress.update({
    where: { userId_itemId: { userId, itemId } },
    data: {
      quizCompleted: false,
      quizScore: null,
      quizTotal: null,
      completedAt: null,
    },
  });

  await logActivity({
    type: 'question.invalidated',
    userId,
    actorId,
    actorRole: actorType,
    targetType: 'Question',
    targetId: questionId,
    severity: 'warn',
    metadata: { reason, itemId, invalidationId: invalidation.id },
  });

  revalidatePath(`/admin/users/${userId}`);
  await broadcast(`user-${userId}`, 'question-invalidated', { questionId, itemId, reason });

  return Response.json({ ok: true, invalidation });
}

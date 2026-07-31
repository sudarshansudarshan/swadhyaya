import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getItemLock } from '@/lib/progress';
import { ItemClient } from './item-client';

export default async function ItemPage({
  params,
}: {
  params: Promise<{
    courseId: string;
    moduleId: string;
    sectionId: string;
    itemId: string;
  }>;
}) {
  const { courseId, moduleId, sectionId, itemId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const item = await prisma.item.findFirst({
    where: { id: itemId, sectionId },
    include: { section: { include: { module: true } } },
  });
  if (!item) notFound();

  const lock = await getItemLock(user.id, itemId);
  if (lock.locked) {
    if (lock.reason === 'module') redirect(`/learn/${courseId}`);
    if (lock.reason === 'section') redirect(`/learn/${courseId}/${moduleId}`);
    redirect(`/learn/${courseId}/${moduleId}/${sectionId}`);
  }

  const questions = await prisma.question.findMany({
    where: { topicId: item.section.questionBankId ?? '' },
  });

  const progress = await prisma.topicProgress.findUnique({
    where: { userId_itemId: { userId: user.id, itemId } },
  });

  const sectionItems = await prisma.item.findMany({
    where: { sectionId },
    orderBy: { order: 'asc' },
  });
  const sectionVideo = sectionItems.find((i) => i.type === 'VIDEO') ?? null;
  const sectionVideoHref = sectionVideo
    ? `/learn/${courseId}/${moduleId}/${sectionId}/${sectionVideo.id}`
    : null;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { number: 'asc' },
        include: {
          sections: {
            orderBy: { number: 'asc' },
            include: { items: { orderBy: { order: 'asc' } } },
          },
        },
      },
    },
  });
  let nextItemHref: string | null = null;
  if (course) {
    outer: for (const m of course.modules) {
      for (const s of m.sections) {
        for (let i = 0; i < s.items.length; i++) {
          if (s.items[i].id !== itemId) continue;
          if (i + 1 < s.items.length) {
            nextItemHref = `/learn/${courseId}/${m.id}/${s.id}/${s.items[i + 1].id}`;
            break outer;
          }
          const nextSections = [...m.sections].slice(m.sections.indexOf(s) + 1);
          const nextS = nextSections.find((ns) => ns.items.length > 0);
          if (nextS) {
            nextItemHref = `/learn/${courseId}/${m.id}/${nextS.id}/${nextS.items[0].id}`;
            break outer;
          }
          const nextModules = [...course.modules].slice(course.modules.indexOf(m) + 1);
          const nextM = nextModules.find((nm) => nm.sections.some((ns) => ns.items.length > 0));
          if (nextM) {
            const ns = nextM.sections.find((x) => x.items.length > 0)!;
            nextItemHref = `/learn/${courseId}/${nextM.id}/${ns.id}/${ns.items[0].id}`;
            break outer;
          }
          nextItemHref = `/learn/${courseId}`;
          break outer;
        }
      }
    }
  }

  return (
    <ItemClient
      item={{
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        muxPlaybackId: item.muxPlaybackId,
        videoStartTime: item.videoStartTime,
        videoEndTime: item.videoEndTime,
        videoMinWatchSeconds: item.videoMinWatchSeconds,
        activityHtmlSlug: item.activityHtmlSlug,
        activityMinSeconds: item.activityMinSeconds,
        quizQuestionCount: item.quizQuestionCount,
        quizPassThreshold: item.quizPassThreshold,
        quizTimeLimit: item.quizTimeLimit,
      }}
      progress={progress}
      questions={questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options as { text: string; correct: boolean }[],
        explanation: q.explanation ?? undefined,
      }))}
      sectionTitle={item.section.title}
      backHref={`/learn/${courseId}/${moduleId}/${sectionId}`}
      sectionVideoHref={sectionVideoHref}
      nextItemHref={nextItemHref}
    />
  );
}

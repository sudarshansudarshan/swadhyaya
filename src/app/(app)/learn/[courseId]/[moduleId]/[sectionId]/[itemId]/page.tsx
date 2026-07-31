import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
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

  const questions = await prisma.question.findMany({
    where: { topicId: item.section.questionBankId ?? '' },
  });

  const progress = await prisma.topicProgress.findUnique({
    where: { userId_itemId: { userId: user.id, itemId } },
  });

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
        options: q.options as any,
        explanation: q.explanation ?? undefined,
      }))}
      userId={user.id}
      sectionTitle={item.section.title}
      backHref={`/learn/${courseId}/${moduleId}/${sectionId}`}
    />
  );
}

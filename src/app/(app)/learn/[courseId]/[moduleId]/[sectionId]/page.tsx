import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getCourseLockState } from '@/lib/progress';
import { CheckCircle, Lock, Video, Activity as ActivityIcon, ClipboardCheck } from 'lucide-react';

export default async function SectionPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; sectionId: string }>;
}) {
  const { courseId, moduleId, sectionId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const section = await prisma.section.findFirst({
    where: { id: sectionId, moduleId },
    include: { items: { orderBy: { order: 'asc' } } },
  });
  if (!section) notFound();

  const lockState = await getCourseLockState(user.id, courseId);
  const moduleState = lockState.modules.get(moduleId);
  if (moduleState?.locked) redirect(`/learn/${courseId}`);
  const sectionState = lockState.sections.get(sectionId);
  if (sectionState?.locked) redirect(`/learn/${courseId}/${moduleId}`);

  const quizItems = section.items.filter((i) => i.type === 'QUIZ');
  const attempts = quizItems.length
    ? await prisma.quizAttempt.findMany({
        where: { userId: user.id, itemId: { in: quizItems.map((i) => i.id) } },
        orderBy: { submittedAt: 'desc' },
      })
    : [];
  const latestAttempt = new Map<string, { passed: boolean }>();
  for (const a of attempts) {
    if (!latestAttempt.has(a.itemId)) latestAttempt.set(a.itemId, a);
  }
  const sectionQuizFailed = quizItems.some((i) => {
    const a = latestAttempt.get(i.id);
    return a ? !a.passed : false;
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="text-xs text-muted-foreground">Section {section.number}</div>
        <h1 className="text-3xl font-bold">{section.title}</h1>
        {section.prompt && (
          <p className="mt-2 text-muted-foreground">{section.prompt}</p>
        )}
        {sectionState?.complete && (
          <p className="mt-2 text-sm text-emerald-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" /> Section complete
          </p>
        )}
      </div>

      <div className="space-y-3">
        {section.items.map((item) => {
          const st = lockState.items.get(item.id);
          const done = st?.done;
          const isDone = item.type === 'VIDEO'
            ? done?.video
            : item.type === 'ACTIVITY'
            ? done?.activity
            : done?.quiz;
          const locked = st?.locked ?? false;

          const isFailed =
            item.type === 'QUIZ'
              ? latestAttempt.get(item.id) && !latestAttempt.get(item.id)!.passed
              : item.type === 'VIDEO' && sectionQuizFailed && !done?.video;

          const Icon = item.type === 'VIDEO' ? Video : item.type === 'ACTIVITY' ? ActivityIcon : ClipboardCheck;

          return (
            <Link
              key={item.id}
              href={locked ? '#' : `/learn/${courseId}/${moduleId}/${sectionId}/${item.id}`}
              className={`flex items-center justify-between p-4 bg-white border rounded-xl transition ${
                locked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  item.type === 'VIDEO' ? 'bg-blue-100' :
                  item.type === 'ACTIVITY' ? 'bg-amber-100' : 'bg-emerald-100'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.type === 'VIDEO' && `${item.videoMinWatchSeconds}s minimum`}
                    {item.type === 'ACTIVITY' && `${item.activityMinSeconds}s minimum`}
                    {item.type === 'QUIZ' && `${item.quizQuestionCount} questions · pass ${item.quizPassThreshold}/${item.quizQuestionCount}`}
                  </div>
                  {isFailed && (
                    <div className="text-xs text-red-600 font-medium mt-0.5">
                      {item.type === 'QUIZ' ? '✗ Incorrect · retake the quiz' : '✗ Incorrect · re-watch the video'}
                    </div>
                  )}
                </div>
              </div>
              <div>
                {isDone ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                ) : locked ? (
                  <Lock className="h-5 w-5 text-gray-400" />
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

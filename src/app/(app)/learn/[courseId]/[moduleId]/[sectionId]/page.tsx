import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
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

  const progress = await prisma.topicProgress.findMany({
    where: { userId: user.id, itemId: { in: section.items.map((i) => i.id) } },
  });
  const progressMap = new Map(progress.map((p) => [p.itemId, p]));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="text-xs text-muted-foreground">Section {section.number}</div>
        <h1 className="text-3xl font-bold">{section.title}</h1>
        {section.prompt && (
          <p className="mt-2 text-muted-foreground">{section.prompt}</p>
        )}
      </div>

      <div className="space-y-3">
        {section.items.map((item) => {
          const p = progressMap.get(item.id);
          const isDone = item.type === 'VIDEO'
            ? p?.videoCompleted
            : item.type === 'ACTIVITY'
            ? p?.activityCompleted
            : p?.quizCompleted;

          const prev = section.items.find((i) => i.order === item.order - 1);
          const prevDone = !prev || progressMap.get(prev.id)?.[
            prev.type === 'VIDEO' ? 'videoCompleted' : prev.type === 'ACTIVITY' ? 'activityCompleted' : 'quizCompleted'
          ];
          const locked = !!prev && !prevDone;

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

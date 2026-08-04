import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getCourseLockState } from '@/lib/progress';
import {
  CheckCircle,
  Lock,
  Video,
  Activity as ActivityIcon,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { getActivity, KIND_LABELS } from '@/lib/activities';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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
        <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
          <span>Section {section.number}</span>
          {sectionState?.complete && (
            <Badge tone="emerald" icon={<CheckCircle className="h-3 w-3" />}>
              Complete
            </Badge>
          )}
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
          {section.title}
        </h1>
        {section.prompt && (
          <p className="mt-2 text-[var(--ink-soft)]">{section.prompt}</p>
        )}
      </div>

      <div className="space-y-3">
        {section.items.map((item, idx) => {
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
          const tone =
            item.type === 'VIDEO' ? 'sky' : item.type === 'ACTIVITY' ? 'amber' : 'emerald';
          const toneBg =
            item.type === 'VIDEO'
              ? 'bg-sky-100 text-sky-700'
              : item.type === 'ACTIVITY'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700';
          const ordinal = ['I.', 'II.', 'III.', 'IV.'][idx] ?? `${idx + 1}.`;

          const activityMeta =
            item.type === 'ACTIVITY' && item.activityHtmlSlug
              ? getActivity(item.activityHtmlSlug)
              : null;

          return (
            <Link
              key={item.id}
              href={locked ? '#' : `/learn/${courseId}/${moduleId}/${sectionId}/${item.id}`}
              className={`group relative block rounded-2xl border bg-white p-4 transition-all duration-200 ${
                locked
                  ? 'cursor-not-allowed border-[var(--paper-line)] opacity-50'
                  : 'border-[var(--paper-line)]/60 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <span className="font-mono text-[10px] font-bold text-[var(--ink-soft)]">
                    {ordinal}
                  </span>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={tone}>{item.type}</Badge>
                    {activityMeta && (
                      <Badge tone={KIND_LABELS[activityMeta.kind].tone}>
                        {KIND_LABELS[activityMeta.kind].label}
                      </Badge>
                    )}
                    {isDone && (
                      <Badge tone="emerald" icon={<CheckCircle className="h-3 w-3" />}>
                        Done
                      </Badge>
                    )}
                    {locked && (
                      <Badge tone="slate" icon={<Lock className="h-3 w-3" />}>
                        Locked
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 font-semibold text-[var(--ink)]">{item.title}</div>
                  <div className="mt-0.5 text-xs text-[var(--ink-soft)]">
                    {item.type === 'VIDEO' && `${item.videoMinWatchSeconds}s minimum watch time`}
                    {item.type === 'ACTIVITY' && `${item.activityMinSeconds}s minimum · opens in a new tab`}
                    {item.type === 'QUIZ' && `${item.quizQuestionCount} questions · pass ${item.quizPassThreshold}/${item.quizQuestionCount}`}
                  </div>
                  {activityMeta && (
                    <p className="mt-1.5 line-clamp-1 text-xs text-[var(--ink-soft)]">
                      <Sparkles className="mr-0.5 inline h-3 w-3" />
                      {activityMeta.title} — introduced by {activityMeta.figure}
                    </p>
                  )}
                  {isFailed && (
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                      ✗ {item.type === 'QUIZ' ? 'Incorrect · retake the quiz' : 'Re-watch the video'}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 self-center">
                  {isDone ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : locked ? (
                    <Lock className="h-5 w-5 text-gray-400" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--paper)] text-[var(--ink-soft)] transition group-hover:bg-emerald-100 group-hover:text-[var(--primary)]">
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </div>
                  )}
                  {item.type === 'ACTIVITY' && !locked && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--accent)]">
                      new tab
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Card padding="md" className="bg-gradient-to-br from-emerald-50/40 to-violet-50/40">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[var(--ink)]">Tip</div>
            <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
              Activities open in a new tab so you can keep this page nearby. The timer
              pauses if you switch away, and your progress syncs back here automatically.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

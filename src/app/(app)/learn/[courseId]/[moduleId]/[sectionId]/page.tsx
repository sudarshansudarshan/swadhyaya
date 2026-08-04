import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getCourseLockState } from '@/lib/progress';
import { getActivity, KIND_LABELS } from '@/lib/activities';

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
    <div className="space-y-6" style={{ maxWidth: 760 }}>
      <div className="welcome-box" style={{ paddingTop: 0, paddingBottom: 0, textAlign: 'left' }}>
        <p className="custom-section-label">Section {section.number}</p>
        <h1 style={{ textAlign: 'left' }}>{section.title}</h1>
        {section.prompt && (
          <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>
            {section.prompt}
          </p>
        )}
        {sectionState?.complete && (
          <div className="feedback correct" style={{ marginTop: 20, display: 'inline-block', padding: '8px 18px' }}>
            Section complete
          </div>
        )}
      </div>

      <div className="menu-grid" style={{ justifyContent: 'flex-start' }}>
        {section.items.map((item, idx) => {
          const st = lockState.items.get(item.id);
          const done = st?.done;
          const isDone =
            item.type === 'VIDEO'
              ? done?.video
              : item.type === 'ACTIVITY'
                ? done?.activity
                : done?.quiz;
          const locked = st?.locked ?? false;

          const isFailed =
            item.type === 'QUIZ'
              ? latestAttempt.get(item.id) && !latestAttempt.get(item.id)!.passed
              : item.type === 'VIDEO' && sectionQuizFailed && !done?.video;

          const ordinal = ['I.', 'II.', 'III.', 'IV.'][idx] ?? `${idx + 1}.`;
          const activityMeta =
            item.type === 'ACTIVITY' && item.activityHtmlSlug
              ? getActivity(item.activityHtmlSlug)
              : null;

          const href = locked
            ? '#'
            : item.type === 'ACTIVITY' && item.activityHtmlSlug
              ? `/activity/${item.activityHtmlSlug}?itemId=${item.id}&min=${item.activityMinSeconds}`
              : `/learn/${courseId}/${moduleId}/${sectionId}/${item.id}`;

          const subtitle =
            item.type === 'VIDEO'
              ? `${item.videoMinWatchSeconds}s minimum`
              : item.type === 'ACTIVITY'
                ? `${item.activityMinSeconds}s minimum`
                : `${item.quizQuestionCount} questions · pass ${item.quizPassThreshold}`;

          const kindLabel = activityMeta ? KIND_LABELS[activityMeta.kind] : null;

          return (
            <Link
              key={item.id}
              href={href}
              target={item.type === 'ACTIVITY' ? '_blank' : undefined}
              rel={item.type === 'ACTIVITY' ? 'noopener noreferrer' : undefined}
              className={`menu-card ${isDone ? '' : locked ? 'placeholder' : ''}`}
              style={{
                width: '100%',
                maxWidth: 360,
                textDecoration: 'none',
                opacity: locked ? 0.5 : 1,
                pointerEvents: locked ? 'none' : 'auto',
              }}
            >
              <div className="menu-title">
                {ordinal} {item.type}
                {isDone ? ' ✓' : ''}
              </div>
              <div className="menu-subtitle">{subtitle}</div>
              {kindLabel && (
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--clr-text-soft)',
                    marginTop: 4,
                  }}
                >
                  {kindLabel} — {activityMeta?.figure}
                </div>
              )}
              {isFailed && (
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--clr-wrong)',
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  ✗ {item.type === 'QUIZ' ? 'retake the quiz' : 're-watch the video'}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
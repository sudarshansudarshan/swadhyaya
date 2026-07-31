import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { SectionEditor } from '@/components/admin/SectionEditor';

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; sectionId: string }>;
}) {
  await requireAdmin();
  const { courseId, moduleId, sectionId } = await params;

  const section = await prisma.section.findFirst({
    where: { id: sectionId, moduleId },
    include: { items: { orderBy: { order: 'asc' } }, module: { include: { course: true } } },
  });
  if (!section) notFound();

  const availableSlugs = [
    'gargi-matrix-loom', 'bhavabhuti-range-of-B', 'kalidasa-verses-line', 'aryabhata-quadratic',
    'bhaskaracharya-cubic', 'panini-linear-map', 'panini-dimensions', 'bhavabhuti-singular-matrix',
    'nullspace-line', 'hill-cipher', 'jayadeva-cafe-equations', 'tulsidas-cafe-overdetermined',
    'chanakya-bookclub-line', 'markov-city-chain', 'markov-mood-chain', 'charaka-perpendicular-vectors',
    'vyasa-perpendicular-plane', 'bharavi-3d-line', 'vidyapati-3d-line', 'nagarjuna-matrix-function',
    'orthogonal-complements', 'bhaskara-cubic-find-x', 'nagarjuna-slope-peaks', 'collapse-dimension',
    'spanning-plane', 'patanjali-three-subspaces', 'tenali-birbal-fruit-stall',
  ];

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">{section.title}</h1>
      <p className="text-muted-foreground">
        {section.module.course.title} · Module {section.module.number} · Section {section.number}
      </p>

      <SectionEditor
        section={{
          id: section.id,
          title: section.title,
          prompt: section.prompt ?? '',
          activityHtmlSlug: section.activityHtmlSlug ?? '',
          questionBankId: section.questionBankId ?? '',
        }}
        items={section.items.map((i) => ({
          id: i.id,
          order: i.order,
          type: i.type,
          title: i.title,
          description: i.description,
          muxPlaybackId: i.muxPlaybackId,
          videoStartTime: i.videoStartTime,
          videoEndTime: i.videoEndTime,
          videoMinWatchSeconds: i.videoMinWatchSeconds,
          activityHtmlSlug: i.activityHtmlSlug,
          activityMinSeconds: i.activityMinSeconds,
          quizQuestionCount: i.quizQuestionCount,
          quizPassThreshold: i.quizPassThreshold,
          quizTimeLimit: i.quizTimeLimit,
        }))}
        availableSlugs={availableSlugs}
      />
    </div>
  );
}

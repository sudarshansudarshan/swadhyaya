import { redirect, notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { InstructorForm } from '@/components/admin/InstructorForm';
import { ALL_PERMISSIONS, PERMISSION_GROUPS, PRESETS, PRESET_DESCRIPTIONS } from '@/lib/permissions';

export default async function EditInstructorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [instructor, modules] = await Promise.all([
    prisma.instructor.findUnique({ where: { id } }),
    prisma.module.findMany({
      where: { course: { isPublished: true } },
      include: { course: { select: { title: true } } },
    }),
  ]);

  if (!instructor) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Edit Instructor: {instructor.name}</h1>
      <InstructorForm
        mode="edit"
        initial={{
          id: instructor.id,
          name: instructor.name,
          email: instructor.email,
          staffRole: instructor.staffRole,
          preset: instructor.preset,
          moduleIds: instructor.moduleIds,
          permissions: instructor.permissions,
          validUntil: instructor.validUntil,
          active: instructor.active,
        }}
        modules={modules.map((m) => ({ id: m.id, label: `${m.course.title} · Module ${m.number}` }))}
        presets={PRESETS}
        presetDescriptions={PRESET_DESCRIPTIONS}
        groups={PERMISSION_GROUPS}
        allPermissions={ALL_PERMISSIONS}
      />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { InstructorForm } from '@/components/admin/InstructorForm';
import { ALL_PERMISSIONS, PERMISSION_GROUPS, PRESETS, PRESET_DESCRIPTIONS } from '@/lib/permissions';

export default async function NewInstructorPage() {
  await requireAdmin();
  const modules = await prisma.module.findMany({
    where: { course: { isPublished: true } },
    include: { course: { select: { title: true } } },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Add Instructor</h1>
      <InstructorForm
        mode="create"
        modules={modules.map((m) => ({ id: m.id, label: `${m.course.title} · Module ${m.number}` }))}
        presets={PRESETS}
        presetDescriptions={PRESET_DESCRIPTIONS}
        groups={PERMISSION_GROUPS}
        allPermissions={ALL_PERMISSIONS}
      />
    </div>
  );
}

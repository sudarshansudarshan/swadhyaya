import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default async function AdminCourseDetail({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireAdmin();
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { number: 'asc' },
        include: { sections: { orderBy: { number: 'asc' }, include: { items: { orderBy: { order: 'asc' } } } } },
      },
    },
  });
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{course.title}</h1>

      <div className="space-y-3">
        {course.modules.map((m) => (
          <div key={m.id} className="bg-white border rounded-xl">
            <div className="p-4 border-b font-semibold">Module {m.number} {m.title && `· ${m.title}`}</div>
            <div className="divide-y">
              {m.sections.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/courses/${course.id}/modules/${m.id}/sections/${s.id}`}
                  className="block p-3 flex items-center justify-between text-sm hover:bg-gray-50"
                >
                  <span>
                    <span className="text-muted-foreground mr-2">{s.number}.</span>
                    {s.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{s.items.length} items</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

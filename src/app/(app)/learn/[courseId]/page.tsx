import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { ChevronRight } from 'lucide-react';

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { number: 'asc' },
        include: { sections: { orderBy: { number: 'asc' } } },
      },
    },
  });

  if (!course) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground mt-1">
          {course.modules.length} modules · {course.modules.reduce((s, m) => s + m.sections.length, 0)} topics
        </p>
      </div>

      <div className="space-y-3">
        {course.modules.map((m) => (
          <Link
            key={m.id}
            href={`/learn/${course.id}/${m.id}`}
            className="flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-md transition"
          >
            <div>
              <div className="text-xs text-muted-foreground">Module {m.number}</div>
              <div className="font-semibold">{m.title ?? `Module ${m.number}`}</div>
              <div className="text-sm text-muted-foreground mt-1">{m.sections.length} topics</div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';

export default async function AdminCoursesPage() {
  await requireAdmin();

  const courses = await prisma.course.findMany({
    include: { modules: { orderBy: { number: 'asc' } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Courses</h1>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-1">
          <Plus className="h-4 w-4" /> New Course
        </button>
      </div>

      <div className="space-y-3">
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/admin/courses/${c.id}`}
            className="block p-4 bg-white border rounded-xl hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.title}</div>
                <div className="text-sm text-muted-foreground">{c.modules.length} modules</div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

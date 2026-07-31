import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Plus } from 'lucide-react';

export default async function AdminInstructorsPage() {
  await requireAdmin();
  const instructors = await prisma.instructor.findMany({
    include: { user: true, modules: true, _count: { select: { bookings: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructors</h1>
          <p className="text-muted-foreground">{instructors.length} instructor(s) · granular permissions per instructor</p>
        </div>
        <Link
          href="/admin/instructors/new"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Add Instructor
        </Link>
      </div>

      <div className="space-y-2">
        {instructors.map((i) => (
          <Link
            key={i.id}
            href={`/admin/instructors/${i.id}`}
            className="block p-4 bg-white border rounded-xl hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{i.name}</div>
                <div className="text-sm text-muted-foreground">{i.email}</div>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 bg-gray-100 rounded">{i.staffRole.replace(/_/g, ' ')}</span>
                {i.preset && <span className="px-2 py-0.5 bg-blue-100 rounded">{i.preset}</span>}
                <span className="px-2 py-0.5 bg-emerald-100 rounded">{i._count.bookings} bookings</span>
                {!i.active && <span className="px-2 py-0.5 bg-red-100 rounded">inactive</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

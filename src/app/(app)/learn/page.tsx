import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export default async function LearnPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: { modules: { orderBy: { number: 'asc' } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Courses</h1>
        <p className="text-muted-foreground mt-1">Choose a course to begin learning.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/learn/${course.id}`}
            className="block p-6 bg-white border rounded-xl hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold">{course.title}</h2>
            {course.description && (
              <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
            )}
            <div className="mt-4 text-sm text-emerald-600">{course.modules.length} modules</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

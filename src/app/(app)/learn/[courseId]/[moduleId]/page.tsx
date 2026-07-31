import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { ChevronRight } from 'lucide-react';

export default async function ModulePage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const moduleRecord = await prisma.module.findFirst({
    where: { id: moduleId, courseId },
    include: { sections: { orderBy: { number: 'asc' } } },
  });
  if (!moduleRecord) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-muted-foreground">Module {moduleRecord.number}</div>
        <h1 className="text-3xl font-bold">{moduleRecord.title ?? `Module ${moduleRecord.number}`}</h1>
      </div>

      <div className="space-y-2">
        {moduleRecord.sections.map((s) => (
          <Link
            key={s.id}
            href={`/learn/${courseId}/${moduleRecord.id}/${s.id}`}
            className="flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-md transition"
          >
            <div>
              <div className="text-xs text-muted-foreground">Section {s.number}</div>
              <div className="font-medium">{s.title}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}

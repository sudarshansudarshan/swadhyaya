import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getCourseLockState } from '@/lib/progress';
import { CheckCircle, ChevronRight, Lock } from 'lucide-react';

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

  const lockState = await getCourseLockState(user.id, courseId);
  const moduleState = lockState.modules.get(moduleId);
  if (moduleState?.locked) redirect(`/learn/${courseId}`);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-muted-foreground">Module {moduleRecord.number}</div>
        <h1 className="text-3xl font-bold">{moduleRecord.title ?? `Module ${moduleRecord.number}`}</h1>
      </div>

      <div className="space-y-2">
        {moduleRecord.sections.map((s) => {
          const st = lockState.sections.get(s.id);
          const locked = st?.locked ?? false;
          const complete = st?.complete ?? false;
          const inner = (
            <div className="flex items-center justify-between p-4 bg-white border rounded-xl transition">
              <div>
                <div className="text-xs text-muted-foreground">Section {s.number}</div>
                <div className="font-medium">{s.title}</div>
                {locked && (
                  <div className="text-xs text-amber-600 mt-1">Complete Section {s.number - 1} to unlock</div>
                )}
              </div>
              <div>
                {complete ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                ) : locked ? (
                  <Lock className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          );
          return locked ? (
            <div key={s.id} className="opacity-50 cursor-not-allowed">{inner}</div>
          ) : (
            <Link key={s.id} href={`/learn/${courseId}/${moduleRecord.id}/${s.id}`} className="block hover:shadow-md">{inner}</Link>
          );
        })}
      </div>
    </div>
  );
}

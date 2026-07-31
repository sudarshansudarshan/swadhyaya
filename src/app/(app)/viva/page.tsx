import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { StudentVivaDashboard } from '@/components/viva/StudentVivaDashboard';

export default async function StudentVivaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const userId = user.id;
  const [moduleProgress, bookings, instructors] = await Promise.all([
    prisma.moduleProgress.findMany({
      where: { userId, allItemsDone: true },
      include: { module: { include: { course: true } } },
    }),
    prisma.vivaBooking.findMany({
      where: { userId },
      include: { slot: { include: { instructor: true, module: true } }, module: true },
      orderBy: { bookedAt: 'desc' },
    }),
    prisma.instructor.findMany({ where: { active: true } }),
  ]);

  const completedModuleIds = new Set(moduleProgress.map((mp) => mp.moduleId));
  const completedModules = await prisma.module.findMany({
    where: { id: { in: Array.from(completedModuleIds) } },
    include: { course: true },
  });

  const availableSlots = await prisma.vivaSlot.findMany({
    where: {
      moduleId: { in: Array.from(completedModuleIds) },
      startUtc: { gte: new Date() },
    },
    include: { instructor: true, module: true },
    orderBy: { startUtc: 'asc' },
    take: 50,
  });

  return (
    <StudentVivaDashboard
      completedModules={completedModules}
      bookings={bookings as any}
      availableSlots={availableSlots as any}
      instructors={instructors}
    />
  );
}

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { UserDetail } from '@/components/admin/UserDetail';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      cohort: true,
      enrollments: { include: { course: true } },
      progress: { include: { item: { include: { section: { include: { module: true } } } } } },
      moduleProgress: { include: { module: true } },
      quizAttempts: { take: 50, orderBy: { submittedAt: 'desc' }, include: { item: true } },
      videoWatches: { take: 50, orderBy: { startedAt: 'desc' }, include: { item: true } },
      proctorSessions: { take: 20, orderBy: { startedAt: 'desc' }, include: { item: true } },
      emotions: { take: 50, orderBy: { createdAt: 'desc' } },
      vivaBookings: { include: { slot: { include: { instructor: true } }, module: true } },
      scoreResets: { orderBy: { createdAt: 'desc' }, take: 20 },
      questionInvalidations: { orderBy: { createdAt: 'desc' }, take: 20 },
      adminNotes: { orderBy: { createdAt: 'desc' } },
      activityLogs: { take: 100, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!user) notFound();

  return <UserDetail user={user as any} />;
}

import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { VivaApprovalClient } from '@/components/teacher/VivaApprovalClient';

export default async function VivaDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.isInstructor && !user.isAdmin) redirect('/dashboard');

  const booking = await prisma.vivaBooking.findUnique({
    where: { id: bookingId },
    include: {
      user: { include: { progress: { include: { item: true } }, moduleProgress: true } },
      module: true,
      slot: { include: { instructor: true } },
    },
  });
  if (!booking) notFound();

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId: booking.userId },
    orderBy: { submittedAt: 'desc' },
    take: 20,
  });

  const proctorSessions = await prisma.proctorSession.findMany({
    where: { userId: booking.userId },
    orderBy: { startedAt: 'desc' },
    take: 10,
  });

  const videoWatches = await prisma.videoWatch.findMany({
    where: { userId: booking.userId },
    orderBy: { startedAt: 'desc' },
    take: 20,
  });

  return (
    <VivaApprovalClient
      booking={{
        id: booking.id,
        status: booking.status,
        meetingUrl: booking.meetingUrl,
        rejectionReason: booking.rejectionReason,
        bookedAt: booking.bookedAt.toISOString(),
        user: {
          id: booking.user.id,
          name: booking.user.name,
          email: booking.user.email,
        },
        module: { id: booking.module.id, number: booking.module.number },
        slot: {
          id: booking.slot.id,
          startUtc: booking.slot.startUtc.toISOString(),
          endUtc: booking.slot.endUtc.toISOString(),
          meetingsUrl: booking.slot.meetingsUrl,
        },
        instructor: booking.slot.instructor.name,
      }}
      progress={booking.user.progress}
      moduleProgress={booking.user.moduleProgress}
      quizAttempts={quizAttempts}
      proctorSessions={proctorSessions}
      videoWatches={videoWatches}
    />
  );
}

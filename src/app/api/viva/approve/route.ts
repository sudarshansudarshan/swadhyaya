import { NextRequest } from 'next/server';
import { requirePermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { broadcast } from '@/lib/realtime';
import { sendVivaApprovedEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { bookingId, meetingUrl } = await req.json();

  const booking = await prisma.vivaBooking.findUnique({
    where: { id: bookingId },
    include: { user: true, slot: { include: { instructor: true } }, module: true },
  });
  if (!booking) return Response.json({ error: 'booking_not_found' }, { status: 404 });

  await requirePermission('viva.approve', {
    moduleId: booking.moduleId,
    resourceId: `VivaBooking:${bookingId}`,
  });

  const updated = await prisma.vivaBooking.update({
    where: { id: bookingId },
    data: { status: 'CONFIRMED', meetingUrl },
  });

  // Notify student via SSE
  await broadcast(`viva-${booking.userId}`, 'viva-approved', {
    bookingId,
    meetingUrl,
    moduleId: booking.moduleId,
    startUtc: booking.slot.startUtc,
    instructorName: booking.slot.instructor.name,
  });

  // Send email
  try {
    await sendVivaApprovedEmail(booking.user.email, {
      meetingUrl,
      startUtc: booking.slot.startUtc,
      instructorName: booking.slot.instructor.name,
      moduleNumber: booking.module.number,
    });
  } catch (err) {
    console.error('email failed:', err);
  }

  await logActivity({
    type: 'viva.approve',
    userId: booking.userId,
    targetType: 'VivaBooking',
    targetId: bookingId,
    metadata: { meetingUrl, moduleId: booking.moduleId },
  });

  return Response.json({ ok: true, booking: updated });
}

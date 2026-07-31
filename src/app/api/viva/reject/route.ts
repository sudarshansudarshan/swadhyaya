import { NextRequest } from 'next/server';
import { requirePermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { broadcast } from '@/lib/realtime';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { bookingId, reason } = await req.json();

  const booking = await prisma.vivaBooking.findUnique({
    where: { id: bookingId },
    include: { user: true, module: true },
  });
  if (!booking) return Response.json({ error: 'booking_not_found' }, { status: 404 });

  await requirePermission('viva.reject', {
    moduleId: booking.moduleId,
    resourceId: `VivaBooking:${bookingId}`,
  });

  await prisma.vivaBooking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED', rejectionReason: reason },
  });

  // Free slot capacity
  await prisma.vivaSlot.update({
    where: { id: booking.slotId },
    data: { capacity: { increment: 1 } },
  });

  // Notify student
  await broadcast(`viva-${booking.userId}`, 'viva-rejected', {
    bookingId,
    reason,
    moduleId: booking.moduleId,
  });

  await logActivity({
    type: 'viva.reject',
    userId: booking.userId,
    targetType: 'VivaBooking',
    targetId: bookingId,
    severity: 'warn',
    metadata: { reason, moduleId: booking.moduleId },
  });

  return Response.json({ ok: true });
}

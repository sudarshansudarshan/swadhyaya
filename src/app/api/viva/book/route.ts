import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { broadcast } from '@/lib/realtime';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { slotId } = await req.json();
  const slot = await prisma.vivaSlot.findUnique({
    where: { id: slotId },
    include: { instructor: true, module: true },
  });
  if (!slot) return Response.json({ error: 'slot_not_found' }, { status: 404 });
  if (slot.capacity <= 0) return Response.json({ error: 'slot_full' }, { status: 400 });

  // Check the user has completed all items in this module
  const items = await prisma.item.findMany({ where: { section: { moduleId: slot.moduleId } } });
  const progress = await prisma.topicProgress.findMany({
    where: { userId: user.id, itemId: { in: items.map((i) => i.id) } },
  });
  const allDone = items.every((it) => {
    const p = progress.find((pr) => pr.itemId === it.id);
    if (it.type === 'VIDEO') return p?.videoCompleted;
    if (it.type === 'ACTIVITY') return p?.activityCompleted;
    return p?.quizCompleted;
  });
  if (!allDone) {
    return Response.json({ error: 'module_not_complete' }, { status: 400 });
  }

  // Check no existing booking
  const existing = await prisma.vivaBooking.findUnique({
    where: { userId_moduleId: { userId: user.id, moduleId: slot.moduleId } },
  });
  if (existing) {
    return Response.json({ error: 'already_booked' }, { status: 400 });
  }

  const booking = await prisma.vivaBooking.create({
    data: {
      slotId,
      userId: user.id,
      moduleId: slot.moduleId,
      status: 'PENDING',
    },
  });

  await prisma.vivaSlot.update({
    where: { id: slotId },
    data: { capacity: { decrement: 1 } },
  });

  // Notify instructor
  await broadcast(`viva-instructor-${slot.instructorId}`, 'viva-booked', {
    bookingId: booking.id,
    userName: user.name,
    moduleNumber: slot.module.number,
  });

  await logActivity({
    type: 'viva.book',
    userId: user.id,
    actorId: user.id,
    actorRole: 'STUDENT',
    targetType: 'VivaBooking',
    targetId: booking.id,
    metadata: { slotId, moduleId: slot.moduleId, instructorId: slot.instructorId },
  });

  return Response.json({ ok: true, booking });
}

import { prisma } from '@/lib/prisma';
import { broadcast } from '@/lib/realtime';
import type { ProctorSessionPayload } from '@/types/proctor';

const CHANNEL = 'admin-proctor';

export async function buildSessionPayload(sessionId: string): Promise<ProctorSessionPayload | null> {
  const session = await prisma.proctorSession.findUnique({
    where: { id: sessionId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!session) return null;
  return {
    id: session.id,
    userId: session.userId,
    userName: session.user.name,
    userEmail: session.user.email,
    itemId: session.itemId,
    penaltyScore: session.penaltyScore,
    ejected: session.ejected,
  };
}

export async function broadcastSession(
  event: 'session-start' | 'session-update' | 'session-end',
  sessionId: string,
) {
  const payload = await buildSessionPayload(sessionId);
  if (payload) await broadcast(CHANNEL, event, payload);
}

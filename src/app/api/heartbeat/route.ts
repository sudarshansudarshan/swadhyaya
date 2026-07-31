/**
 * Heartbeat endpoint — called by the client every 10s.
 * Updates the user's LiveSession in Vercel KV and broadcasts to admin-live channel.
 *
 * Edge runtime for low-latency + high-throughput.
 */
import { type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { publishHeartbeat, broadcast } from '@/lib/realtime';
import { logActivity } from '@/lib/activity-log';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const { page, videoTimestamp, quizQuestion, quizScore, itemId, itemType, proctorSessionId, isFullscreen, readyToDetect } = body;

  await publishHeartbeat(user.id, {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    page,
    videoTimestamp,
    quizQuestion,
    quizScore,
    itemId,
    itemType,
    proctorSessionId,
    isFullscreen,
    readyToDetect,
  });

  return Response.json({ ok: true, ts: Date.now() });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { clearHeartbeat } = await import('@/lib/realtime');
  await clearHeartbeat(user.id);

  return Response.json({ ok: true });
}

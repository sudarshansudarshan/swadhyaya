import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { broadcastSession } from '@/lib/proctor/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: { sessionId?: string } = {};
  try {
    body = await req.json();
  } catch {}

  const { sessionId } = body;
  if (!sessionId) return Response.json({ error: 'session_required' }, { status: 400 });

  const session = await prisma.proctorSession.findFirst({
    where: { id: sessionId, userId: user.id, endedAt: { isSet: false } },
  });
  if (!session) return Response.json({ error: 'session_not_found' }, { status: 404 });

  await prisma.proctorSession.update({
    where: { id: session.id },
    data: { endedAt: new Date() },
  });

  await broadcastSession('session-end', session.id);

  return Response.json({ ok: true });
}

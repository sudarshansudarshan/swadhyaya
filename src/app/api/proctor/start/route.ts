import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { broadcastSession } from '@/lib/proctor/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: { itemId?: string } = {};
  try {
    body = await req.json();
  } catch {}

  const { itemId } = body;
  if (!itemId) return Response.json({ error: 'item_required' }, { status: 400 });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return Response.json({ error: 'item_not_found' }, { status: 404 });

  const existing = await prisma.proctorSession.findFirst({
    where: { userId: user.id, itemId, endedAt: { isSet: false } },
    orderBy: { startedAt: 'desc' },
  });

  const session =
    existing ??
    (await prisma.proctorSession.create({
      data: {
        userId: user.id,
        itemId,
        quizType: item.type === 'QUIZ' ? 'quiz' : 'auto',
        startedAt: new Date(),
      },
    }));

  if (!existing) {
    await broadcastSession('session-start', session.id);
  } else {
    await broadcastSession('session-update', session.id);
  }

  return Response.json({ ok: true, sessionId: session.id });
}

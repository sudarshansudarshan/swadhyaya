import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const { itemId, readyToDetect } = body;
  if (!itemId) return Response.json({ ok: true });

  // Find or create proctor session
  const session = await prisma.proctorSession.findFirst({
    where: { userId: user.id, itemId, endedAt: null },
  });

  if (!session) {
    await prisma.proctorSession.create({
      data: {
        userId: user.id,
        itemId,
        quizType: 'auto',
        startedAt: new Date(),
      },
    });
  }

  // For now: simple stub that returns no anomalies
  // Real implementation would run face/voice/motion detection
  return Response.json({
    ok: true,
    anomalies: [],
    penaltyScore: 0,
    readyToDetect: !!readyToDetect,
  });
}

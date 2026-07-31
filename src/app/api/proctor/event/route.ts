import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { broadcastSession } from '@/lib/proctor/server';
import type { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEDUPE_MS = 5000;
const MAX_SCREENSHOT_BYTES = 500 * 1024;

type EventBody = {
  sessionId?: string;
  type?: string;
  severity?: number;
  metadata?: Record<string, unknown>;
  screenshot?: string | null;
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: EventBody = {};
  try {
    body = await req.json();
  } catch {}

  const { sessionId, type, severity, metadata, screenshot } = body;
  if (!sessionId || !type) return Response.json({ error: 'invalid_payload' }, { status: 400 });

  const session = await prisma.proctorSession.findFirst({
    where: { id: sessionId, userId: user.id, endedAt: { isSet: false } },
  });
  if (!session) return Response.json({ error: 'session_not_found' }, { status: 404 });

  const recent = await prisma.proctorEvent.findFirst({
    where: {
      sessionId: session.id,
      type,
      createdAt: { gte: new Date(Date.now() - DEDUPE_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (recent) {
    return Response.json({ ok: true, penaltyScore: session.penaltyScore });
  }

  const screenshotUrl =
    screenshot && screenshot.length > 0 && screenshot.length < MAX_SCREENSHOT_BYTES
      ? screenshot
      : null;

  const penaltyScore = session.penaltyScore + (severity ?? 1);

  await prisma.proctorEvent.create({
    data: {
      sessionId: session.id,
      type,
      severity: severity ?? 1,
      metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      screenshotUrl,
    },
  });

  const updated = await prisma.proctorSession.update({
    where: { id: session.id },
    data: { penaltyScore },
  });

  await broadcastSession('session-update', session.id);

  return Response.json({ ok: true, penaltyScore: updated.penaltyScore });
}

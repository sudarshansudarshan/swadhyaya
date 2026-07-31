/**
 * Cron job: flush Vercel KV heartbeats to LiveSession table every 30s.
 */
import { kv } from '@vercel/kv';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const h = await headers();
  const auth = h.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  const keys = await kv.keys('hb:*');
  if (keys.length === 0) return Response.json({ flushed: 0 });

  const batch = await Promise.all(
    keys.map(async (k) => {
      const userId = k.replace('hb:', '');
      const data = await kv.get(k);
      return data ? { userId, data } : null;
    })
  );

  const validBatch = batch.filter((b): b is { userId: string; data: any } => b !== null);

  for (const { userId, data } of validBatch) {
    await prisma.liveSession.upsert({
      where: { userId },
      create: {
        userId,
        page: data.page,
        itemId: data.itemId,
        itemType: data.itemType,
        videoTimestamp: data.videoTimestamp,
        quizQuestion: data.quizQuestion,
        quizScore: data.quizScore,
        proctorSessionId: data.proctorSessionId,
        isFullscreen: data.isFullscreen,
        readyToDetect: data.readyToDetect,
        lastHeartbeat: new Date(),
      },
      update: {
        page: data.page,
        itemId: data.itemId,
        itemType: data.itemType,
        videoTimestamp: data.videoTimestamp,
        quizQuestion: data.quizQuestion,
        quizScore: data.quizScore,
        lastHeartbeat: new Date(),
      },
    });
  }

  return Response.json({ flushed: validBatch.length });
}

/**
 * Cron job: clean up stale LiveSession rows (>5min no heartbeat).
 */
import { prisma } from '@/lib/prisma';
import { kv } from '@vercel/kv';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const h = await headers();
  const auth = h.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  const cutoff = new Date(Date.now() - 5 * 60_000);
  const result = await prisma.liveSession.deleteMany({
    where: { lastHeartbeat: { lt: cutoff } },
  });

  return Response.json({ deleted: result.count });
}

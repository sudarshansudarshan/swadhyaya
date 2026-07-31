/**
 * Cron job: delete ActivityLog rows older than 90 days.
 */
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

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const result = await prisma.activityLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return Response.json({ deleted: result.count });
}

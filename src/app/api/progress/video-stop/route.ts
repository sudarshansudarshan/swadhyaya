import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { itemId } = await req.json();
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return Response.json({ error: 'item_not_found' }, { status: 404 });

  const progress = await prisma.topicProgress.upsert({
    where: { userId_itemId: { userId: user.id, itemId } },
    create: {
      userId: user.id,
      itemId,
      videoCompleted: true,
      videoWatchedSeconds: 0,
      startedAt: new Date(),
      completedAt: new Date(),
    },
    update: {
      videoCompleted: true,
      completedAt: new Date(),
    },
  });

  await logActivity({
    type: 'video.completed',
    userId: user.id,
    actorId: user.id,
    actorRole: 'STUDENT',
    targetType: 'Item',
    targetId: itemId,
    metadata: { title: item.title },
  });

  return Response.json({ ok: true, progress });
}

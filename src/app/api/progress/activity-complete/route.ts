import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getItemLock } from '@/lib/progress';
import { logActivity } from '@/lib/activity-log';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { itemId } = await req.json();
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return Response.json({ error: 'item_not_found' }, { status: 404 });

  const lock = await getItemLock(user.id, itemId);
  if (lock.locked) return Response.json({ error: 'item_locked', reason: lock.reason }, { status: 403 });

  if (item.activityRequired && !item.activityHtmlSlug) {
    return Response.json({ error: 'activity_not_configured' }, { status: 400 });
  }

  const progress = await prisma.topicProgress.upsert({
    where: { userId_itemId: { userId: user.id, itemId } },
    create: {
      userId: user.id,
      itemId,
      activityCompleted: true,
      startedAt: new Date(),
    },
    update: {
      activityCompleted: true,
    },
  });

  await logActivity({
    type: 'activity.complete',
    userId: user.id,
    actorId: user.id,
    actorRole: 'STUDENT',
    targetType: 'Item',
    targetId: itemId,
  });

  return Response.json({ ok: true, progress });
}

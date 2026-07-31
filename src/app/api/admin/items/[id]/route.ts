import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { revalidatePath } from 'next/cache';
import { broadcast } from '@/lib/realtime';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const body = await req.json();

  const before = await prisma.item.findUnique({ where: { id } });
  if (!before) return Response.json({ error: 'item_not_found' }, { status: 404 });

  const data: any = {};
  if ('muxPlaybackId' in body) data.muxPlaybackId = body.muxPlaybackId || null;
  if ('videoStartTime' in body) data.videoStartTime = body.videoStartTime || null;
  if ('videoEndTime' in body) data.videoEndTime = body.videoEndTime || null;
  if ('activityHtmlSlug' in body) data.activityHtmlSlug = body.activityHtmlSlug || null;
  if ('activityMinSeconds' in body) data.activityMinSeconds = body.activityMinSeconds;
  if ('quizPassThreshold' in body) data.quizPassThreshold = body.quizPassThreshold;
  if ('quizTimeLimit' in body) data.quizTimeLimit = body.quizTimeLimit;

  const after = await prisma.item.update({ where: { id }, data });

  const activityChanged = before.activityHtmlSlug !== after.activityHtmlSlug;

  await logActivity({
    type: activityChanged ? 'item.activity_swap' : 'item.update',
    actorId: admin.id,
    actorRole: 'ADMIN',
    targetType: 'Item',
    targetId: id,
    metadata: {
      title: after.title,
      before: { activityHtmlSlug: before.activityHtmlSlug, muxPlaybackId: before.muxPlaybackId },
      after: { activityHtmlSlug: after.activityHtmlSlug, muxPlaybackId: after.muxPlaybackId },
    },
  });

  revalidatePath(`/learn`);
  await broadcast(`item-${id}`, 'item-updated', { itemId: id, data });

  return Response.json({ ok: true, item: after });
}

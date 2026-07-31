import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

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

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { section: { include: { module: true } } },
  });
  if (!item) return Response.json({ error: 'item_not_found' }, { status: 404 });

  const sectionItems = await prisma.item.findMany({
    where: { sectionId: item.sectionId },
    orderBy: { order: 'asc' },
  });

  for (const si of sectionItems) {
    await prisma.topicProgress.upsert({
      where: { userId_itemId: { userId: user.id, itemId: si.id } },
      create: {
        userId: user.id,
        itemId: si.id,
        videoCompleted: false,
        activityCompleted: false,
        quizCompleted: false,
        videoWatchedSeconds: 0,
      },
      update: {
        videoCompleted: false,
        activityCompleted: false,
        quizCompleted: false,
        videoWatchedSeconds: 0,
        quizScore: null,
        quizTotal: null,
        completedAt: null,
      },
    });
  }

  const videoItem = sectionItems.find((i) => i.type === 'VIDEO');

  await logActivity({
    type: 'proctor.ejected',
    userId: user.id,
    actorId: user.id,
    actorRole: 'STUDENT',
    targetType: 'Section',
    targetId: item.sectionId,
    severity: 'error',
    metadata: { itemId, reason: 'proctoring_fail' },
  });

  const redirectTo = videoItem
    ? `/learn/${item.section.module.courseId}/${item.section.module.id}/${item.sectionId}/${videoItem.id}`
    : null;

  return Response.json({ ok: true, redirectTo });
}

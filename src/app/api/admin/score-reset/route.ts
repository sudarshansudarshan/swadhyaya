import { NextRequest } from 'next/server';
import { requirePermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { broadcast } from '@/lib/realtime';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await requirePermission('students.reset_score');
  const body = await req.json();
  const { userId, scope, itemId, moduleId, resetStages, reason, notes, notifyStudent } = body;

  if (!userId || !scope || !resetStages) {
    return Response.json({ error: 'missing_params' }, { status: 400 });
  }

  const actorId = user.isAdmin ? user.id : (await prisma.instructor.findUnique({ where: { userId: user.id } }))?.id ?? user.id;
  const actorType = user.isAdmin ? 'ADMIN' : 'INSTRUCTOR';

  // 1. Determine affected itemIds
  let affectedItemIds: string[] = [];
  if (scope === 'ITEM' && itemId) {
    affectedItemIds = [itemId];
  } else if (scope === 'MODULE' && moduleId) {
    const items = await prisma.item.findMany({ where: { section: { moduleId } } });
    affectedItemIds = items.map((i) => i.id);
  } else if (scope === 'QUIZ' && itemId) {
    affectedItemIds = [itemId];
  }

  if (affectedItemIds.length === 0 && scope !== 'GLOBAL') {
    return Response.json({ error: 'no_items_resolved' }, { status: 400 });
  }

  // 2. Capture audit record + perform resets in transaction
  await prisma.$transaction(async (tx) => {
    await tx.scoreReset.create({
      data: {
        userId,
        scope,
        itemId: itemId ?? null,
        moduleId: moduleId ?? null,
        resetStages,
        resetById: actorId,
        resetByType: actorType,
        reason: reason ?? null,
        notes: notes ?? null,
      },
    });

    if (affectedItemIds.length > 0) {
      await tx.topicProgress.updateMany({
        where: { userId, itemId: { in: affectedItemIds } },
        data: {
          videoCompleted: resetStages.includes('video') ? false : undefined,
          videoWatchedSeconds: resetStages.includes('video') ? 0 : undefined,
          activityCompleted: resetStages.includes('activity') ? false : undefined,
          quizCompleted: resetStages.includes('quiz') ? false : undefined,
          quizScore: resetStages.includes('quiz') ? null : undefined,
          quizTotal: resetStages.includes('quiz') ? null : undefined,
          completedAt: null,
        },
      });

      if (resetStages.includes('quiz')) {
        await tx.quizAttempt.updateMany({
          where: { userId, itemId: { in: affectedItemIds }, cancelledAt: null },
          data: { cancelledAt: new Date(), cancelledById: actorId },
        });
      }
    }

    if (scope === 'MODULE' || scope === 'COURSE' || scope === 'GLOBAL') {
      // Cancel any pending viva bookings
      const moduleIds = moduleId ? [moduleId] : (await tx.module.findMany({ select: { id: true } })).map((m) => m.id);
      await tx.vivaBooking.updateMany({
        where: {
          userId,
          status: 'PENDING',
          moduleId: { in: moduleIds },
        },
        data: { status: 'CANCELLED', rejectionReason: 'score_reset' },
      });
    }

    await tx.activityLog.create({
      data: {
        type: 'score.reset',
        severity: 'warn',
        actorId,
        actorRole: actorType,
        userId,
        targetType: 'User',
        targetId: userId,
        metadata: { scope, stages: resetStages, reason, notes, itemId, moduleId },
      },
    });
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath(`/learn`);
  await broadcast(`user-${userId}`, 'score-reset', { scope, by: actorType });

  return Response.json({ ok: true, affectedItems: affectedItemIds.length });
}

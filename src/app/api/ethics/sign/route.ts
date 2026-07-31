import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { courseId, versionId } = await req.json();
  if (!courseId) return Response.json({ error: 'courseId_required' }, { status: 400 });

  await prisma.ethicsConsent.upsert({
    where: {
      userId_courseId_versionId: {
        userId: user.id,
        courseId,
        versionId: versionId ?? '1.0',
      },
    },
    create: {
      userId: user.id,
      courseId,
      versionId: versionId ?? '1.0',
    },
    update: {},
  });

  await logActivity({
    type: 'consent.signed',
    userId: user.id,
    actorId: user.id,
    actorRole: 'STUDENT',
    targetType: 'Course',
    targetId: courseId,
  });

  return Response.json({ ok: true });
}

import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json();

  const section = await prisma.section.update({
    where: { id },
    data: {
      title: body.title,
      prompt: body.prompt,
      activityHtmlSlug: body.activityHtmlSlug || null,
    },
  });

  await logActivity({
    type: 'item.update',
    targetType: 'Section',
    targetId: id,
    metadata: { changes: body, by: 'admin' },
  });

  revalidatePath(`/learn`);
  revalidatePath(`/admin/courses`);
  return Response.json({ ok: true, section });
}

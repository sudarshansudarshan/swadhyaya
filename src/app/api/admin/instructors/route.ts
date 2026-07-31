import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { PRESETS } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET() {
  await requireAdmin();
  const instructors = await prisma.instructor.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return Response.json({ instructors });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json();
  const { name, email, preset, staffRole, moduleIds, permissions: customPerms } = body;

  const perms = preset && PRESETS[preset] ? PRESETS[preset] : (customPerms ?? []);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      role: 'INSTRUCTOR',
    },
    update: { role: 'INSTRUCTOR' },
  });

  const instructor = await prisma.instructor.create({
    data: {
      userId: user.id,
      name,
      email,
      preset: preset ?? 'custom',
      permissions: perms,
      staffRole: staffRole ?? 'TEACHING_ASSISTANT',
      moduleIds: moduleIds ?? [],
      active: true,
    },
  });

  return Response.json({ instructor });
}

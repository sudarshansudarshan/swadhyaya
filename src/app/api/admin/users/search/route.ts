import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  await requireAdmin();

  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (q.length < 2) return Response.json({ results: [] });

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { samagamaSub: { contains: q } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      cohort: { select: { name: true } },
    },
    take: 20,
    orderBy: { name: 'asc' },
  });

  return Response.json({ results: users });
}

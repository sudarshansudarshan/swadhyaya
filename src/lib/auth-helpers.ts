/**
 * Auth helpers — require a session, role, or permission.
 * Server-side enforcement of role-based access.
 */
import { redirect } from 'next/navigation';
import { auth } from './auth';
import { prisma } from './prisma';
import type { Permission } from './permissions';

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  isAdmin: boolean;
  isInstructor: boolean;
  instructorId: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    include: { cohort: true },
  });
  if (!user) return null;

  const instructor = await prisma.instructor.findUnique({
    where: { userId: user.id },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    isAdmin: user.role === 'ADMIN',
    isInstructor: user.role === 'INSTRUCTOR',
    instructorId: instructor?.id ?? null,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) redirect('/dashboard');
  return user;
}

export async function requireInstructor(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.isAdmin) return user;
  if (!user.isInstructor) redirect('/dashboard');
  return user;
}

export async function requirePermission(
  perm: Permission,
  context?: { moduleId?: string; resourceId?: string }
): Promise<SessionUser> {
  const user = await requireUser();
  if (user.isAdmin) return user;

  if (!user.isInstructor) {
    throw new Error('forbidden');
  }

  const instructor = await prisma.instructor.findUnique({
    where: { userId: user.id },
  });
  if (!instructor || !instructor.active) {
    throw new Error('instructor_disabled');
  }

  const now = new Date();
  if (instructor.validFrom && now < instructor.validFrom) {
    throw new Error('not_yet_valid');
  }
  if (instructor.validUntil && now > instructor.validUntil) {
    if (instructor.autoRevokeOnExpiry) {
      await prisma.instructor.update({
        where: { id: instructor.id },
        data: { active: false },
      });
    }
    throw new Error('access_expired');
  }

  const perms = (instructor.permissions as Record<string, boolean>) ?? {};
  if (!perms[perm]) {
    throw new Error('permission_denied');
  }

  if (context?.moduleId && instructor.moduleIds.length > 0) {
    if (!instructor.moduleIds.includes(context.moduleId)) {
      throw new Error('module_not_assigned');
    }
  }

  await prisma.instructorActivityLog.create({
    data: {
      instructorId: instructor.id,
      action: perm,
      targetType: context?.resourceId?.split(':')[0],
      targetId: context?.resourceId?.split(':')[1],
    },
  });

  return user;
}

export async function userHasPermission(
  userId: string,
  perm: Permission,
  moduleId?: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (user.role === 'ADMIN') return true;

  if (user.role !== 'INSTRUCTOR') return false;

  const instructor = await prisma.instructor.findUnique({
    where: { userId: user.id },
  });
  if (!instructor || !instructor.active) return false;

  const perms = (instructor.permissions as Record<string, boolean>) ?? {};
  if (!perms[perm]) return false;
  if (moduleId && instructor.moduleIds.length > 0 && !instructor.moduleIds.includes(moduleId)) {
    return false;
  }
  return true;
}

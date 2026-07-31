import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getCourseLockState } from '@/lib/progress';
import { CourseShell } from '@/components/learn/CourseShell';
import type { DrawerModule } from '@/components/learn/CourseDrawer';

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const [course, lockState, allCourses] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { number: 'asc' },
          include: {
            sections: {
              orderBy: { number: 'asc' },
              include: { items: { orderBy: { order: 'asc' } } },
            },
          },
        },
      },
    }),
    getCourseLockState(user.id, courseId),
    prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true },
    }),
  ]);
  if (!course) notFound();

  let completedItems = 0;
  let totalItems = 0;
  const modules: DrawerModule[] = course.modules.map((m) => {
    const mState = lockState.modules.get(m.id);
    return {
      id: m.id,
      number: m.number,
      title: m.title ?? `Module ${m.number}`,
      complete: mState?.complete ?? false,
      locked: mState?.locked ?? false,
      sections: m.sections.map((s) => {
        const sState = lockState.sections.get(s.id);
        return {
          id: s.id,
          number: s.number,
          title: s.title,
          complete: sState?.complete ?? false,
          locked: sState?.locked ?? false,
          items: s.items.map((i) => {
            const st = lockState.items.get(i.id);
            const done = st?.done ?? { video: false, activity: false, quiz: false };
            const isDone =
              i.type === 'VIDEO'
                ? !!done.video
                : i.type === 'ACTIVITY'
                  ? !!done.activity
                  : !!done.quiz;
            if (isDone) completedItems++;
            totalItems++;
            return {
              id: i.id,
              title: i.title,
              type: i.type,
              order: i.order,
              done: isDone,
              locked: st?.locked ?? false,
            };
          }),
        };
      }),
    };
  });

  const courseComplete = modules.every((m) => m.complete);

  const courseIndex = allCourses.findIndex((c) => c.id === courseId);
  const nextCourse =
    courseIndex >= 0 && courseIndex < allCourses.length - 1
      ? allCourses[courseIndex + 1]
      : null;

  return (
    <CourseShell
      course={{ id: course.id, title: course.title, completedItems, totalItems, modules }}
      nextCourse={nextCourse}
      courseComplete={courseComplete}
    >
      {children}
    </CourseShell>
  );
}

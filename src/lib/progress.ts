/**
 * Sequential-progress lock state.
 * Students must complete every item in a section before the next section
 * unlocks, and every section in a module before the next module unlocks.
 */
import { prisma } from './prisma';

export type ItemState = { video: boolean; activity: boolean; quiz: boolean };

export type LockState = {
  modules: Map<string, { complete: boolean; locked: boolean }>;
  sections: Map<string, { complete: boolean; locked: boolean }>;
  items: Map<string, { locked: boolean; done: ItemState }>;
};

function isItemDone(item: { type: string }, p: { videoCompleted?: boolean; activityCompleted?: boolean; quizCompleted?: boolean } | undefined | null): boolean {
  if (!p) return false;
  if (item.type === 'VIDEO') return !!p.videoCompleted;
  if (item.type === 'ACTIVITY') return !!p.activityCompleted;
  return !!p.quizCompleted;
}

export async function getCourseLockState(userId: string, courseId: string): Promise<LockState> {
  const empty: LockState = { modules: new Map(), sections: new Map(), items: new Map() };

  const course = await prisma.course.findUnique({
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
  });
  if (!course) return empty;

  const allItems = course.modules.flatMap((m) => m.sections.flatMap((s) => s.items));
  const progress = await prisma.topicProgress.findMany({
    where: { userId, itemId: { in: allItems.map((i) => i.id) } },
  });
  const progressMap = new Map(progress.map((p) => [p.itemId, p]));

  const state: LockState = { modules: new Map(), sections: new Map(), items: new Map() };

  for (const m of course.modules) {
    for (const s of m.sections) {
      const complete = s.items.every((i) => isItemDone(i, progressMap.get(i.id)));
      state.sections.set(s.id, { complete, locked: false });
    }
    const complete = m.sections.every((s) => state.sections.get(s.id)!.complete);
    state.modules.set(m.id, { complete, locked: false });
  }

  let prevComplete = true;
  for (const m of course.modules) {
    const st = state.modules.get(m.id)!;
    st.locked = !prevComplete;
    prevComplete = prevComplete && st.complete;
  }

  for (const m of course.modules) {
    const mLocked = state.modules.get(m.id)!.locked;
    prevComplete = true;
    for (const s of m.sections) {
      const st = state.sections.get(s.id)!;
      st.locked = mLocked || !prevComplete;
      prevComplete = prevComplete && st.complete;
    }
  }

  for (const m of course.modules) {
    const mLocked = state.modules.get(m.id)!.locked;
    for (const s of m.sections) {
      const sLocked = state.sections.get(s.id)!.locked;
      prevComplete = true;
      for (const i of s.items) {
        const done = {
          video: !!progressMap.get(i.id)?.videoCompleted,
          activity: !!progressMap.get(i.id)?.activityCompleted,
          quiz: !!progressMap.get(i.id)?.quizCompleted,
        };
        state.items.set(i.id, { locked: mLocked || sLocked || !prevComplete, done });
        prevComplete = prevComplete && isItemDone(i, progressMap.get(i.id));
      }
    }
  }

  return state;
}

export type ItemLockCheck = { locked: boolean; reason: 'module' | 'section' | 'item' | 'not_found' | null };

/**
 * Check whether a specific item is currently locked for a user.
 * Used by server pages and progress API routes for defense in depth.
 */
export async function getItemLock(userId: string, itemId: string): Promise<ItemLockCheck> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, type: true, sectionId: true, order: true, section: { select: { id: true, module: { select: { id: true, courseId: true } } } } },
  });
  if (!item) return { locked: true, reason: 'not_found' };

  const state = await getCourseLockState(userId, item.section.module.courseId);

  const moduleState = state.modules.get(item.section.module.id);
  if (moduleState?.locked) return { locked: true, reason: 'module' };
  const sectionState = state.sections.get(item.sectionId);
  if (sectionState?.locked) return { locked: true, reason: 'section' };
  const itemState = state.items.get(item.id);
  if (itemState?.locked) return { locked: true, reason: 'item' };

  return { locked: false, reason: null };
}

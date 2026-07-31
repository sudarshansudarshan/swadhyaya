'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  Play,
  FileEdit,
  HelpCircle,
  Check,
  Lock,
  Home,
  X,
} from 'lucide-react';

export type DrawerItem = {
  id: string;
  title: string;
  type: string;
  order: number;
  done: boolean;
  locked: boolean;
};

export type DrawerSection = {
  id: string;
  number: number;
  title: string;
  complete: boolean;
  locked: boolean;
  items: DrawerItem[];
};

export type DrawerModule = {
  id: string;
  number: number;
  title: string;
  complete: boolean;
  locked: boolean;
  sections: DrawerSection[];
};

export type DrawerCourse = {
  id: string;
  title: string;
  completedItems: number;
  totalItems: number;
  modules: DrawerModule[];
};

type Props = {
  course: DrawerCourse;
  nextCourse: { id: string; title: string } | null;
  courseComplete: boolean;
  onClose: () => void;
};

const getItemIcon = (type: string) => {
  switch ((type || '').toUpperCase()) {
    case 'VIDEO':
      return <Play className="h-3 w-3" />;
    case 'ACTIVITY':
      return <FileEdit className="h-3 w-3" />;
    case 'QUIZ':
      return <HelpCircle className="h-3 w-3" />;
    default:
      return <FileEdit className="h-3 w-3" />;
  }
};

const typeLabel = (type: string) => {
  switch ((type || '').toUpperCase()) {
    case 'VIDEO':
      return 'Video';
    case 'ACTIVITY':
      return 'Activity';
    case 'QUIZ':
      return 'Quiz';
    default:
      return 'Item';
  }
};

export function CourseDrawer({ course, nextCourse, courseComplete, onClose }: Props) {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);
  const currentModuleId = parts[2] ?? null;
  const currentSectionId = parts[3] ?? null;
  const currentItemId = parts[4] ?? null;

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const target = currentModuleId ?? course.modules[0]?.id;
    if (target) initial[target] = true;
    return initial;
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    currentSectionId ? { [currentSectionId]: true } : {}
  );

  const toggleModule = (id: string) =>
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleSection = (id: string) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  let nextToDoId: string | null = null;
  for (const m of course.modules) {
    if (nextToDoId) break;
    for (const s of m.sections) {
      if (nextToDoId) break;
      for (const it of s.items) {
        if (it.id === currentItemId || it.done || it.locked) continue;
        nextToDoId = it.id;
        break;
      }
    }
  }

  const progressPct =
    course.totalItems > 0 ? Math.round((course.completedItems / course.totalItems) * 100) : 0;

  const rowBase = 'transition-[background-color,color,transform] duration-200 ease-out';

  return (
    <aside className="flex h-full w-72 flex-col overflow-hidden rounded-xl border bg-white">
      <div className="shrink-0 border-b px-5 pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Course
            </p>
            <h2 className="mt-1 pr-2 text-lg font-semibold leading-snug" title={course.title}>
              {course.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
            title="Hide course panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {course.totalItems > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold tabular-nums">
                {course.completedItems}/{course.totalItems}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {course.modules.map((module) => {
            const isModuleExpanded = !!expandedModules[module.id];
            const isCurrentModule = module.id === currentModuleId;
            const doneItems = module.sections.reduce(
              (sum, s) => sum + s.items.filter((i) => i.done).length,
              0
            );
            const totalItems = module.sections.reduce((sum, s) => sum + s.items.length, 0);

            return (
              <div key={module.id}>
                <button
                  onClick={() => toggleModule(module.id)}
                  aria-expanded={isModuleExpanded}
                  className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${rowBase} hover:bg-gray-100 ${
                    isCurrentModule ? 'bg-emerald-50 text-emerald-900' : 'text-gray-800'
                  }`}
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ease-out ${
                      isModuleExpanded ? 'rotate-90' : ''
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-xs font-medium">
                        {module.number}. {module.title}
                      </span>
                      <span
                        className={`shrink-0 text-[10px] tabular-nums ${
                          module.complete ? 'text-emerald-600' : 'text-muted-foreground'
                        }`}
                      >
                        {doneItems}/{totalItems}
                      </span>
                    </span>
                    <span className="block text-[10px] text-muted-foreground/80">
                      {module.sections.length} sections
                    </span>
                  </span>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isModuleExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="ml-3 mt-1 space-y-1 border-l border-gray-200 pl-2">
                      {module.sections.map((section) => {
                        const isSectionExpanded = !!expandedSections[section.id];
                        const isCurrentSection = section.id === currentSectionId;

                        return (
                          <div key={section.id}>
                            <button
                              onClick={() => toggleSection(section.id)}
                              aria-expanded={isSectionExpanded}
                              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs ${rowBase} hover:bg-gray-100 ${
                                isCurrentSection ? 'text-gray-900' : 'text-gray-500'
                              }`}
                            >
                              <ChevronRight
                                className={`h-3 w-3 shrink-0 text-gray-400 transition-transform duration-200 ease-out ${
                                  isSectionExpanded ? 'rotate-90' : ''
                                }`}
                              />
                              <span className="truncate font-medium">
                                {section.number}. {section.title}
                              </span>
                              {section.complete && (
                                <Check className="ml-auto h-3 w-3 shrink-0 text-emerald-500" />
                              )}
                            </button>

                            {isSectionExpanded && (
                              <div className="ml-3 mt-0.5 space-y-0.5">
                                {section.items.length === 0 && (
                                  <div className="p-2 text-center text-[11px] text-muted-foreground/70">
                                    No items found
                                  </div>
                                )}
                                {section.items.map((item) => {
                                  const isCurrentItem = item.id === currentItemId;
                                  const isNext =
                                    !item.locked && !item.done && !isCurrentItem && item.id === nextToDoId;
                                  const href = `/learn/${course.id}/${module.id}/${section.id}/${item.id}`;

                                  return item.locked ? (
                                    <div
                                      key={item.id}
                                      className="flex w-full cursor-not-allowed items-start gap-2.5 rounded-lg px-2.5 py-2 text-left opacity-45"
                                    >
                                      <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border border-gray-300 text-gray-400">
                                        <Lock className="h-2.5 w-2.5" />
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-medium text-gray-400">
                                          {item.title}
                                        </span>
                                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                          <span className="opacity-80">{getItemIcon(item.type)}</span>
                                          <span>{typeLabel(item.type)}</span>
                                        </span>
                                      </span>
                                    </div>
                                  ) : (
                                    <Link
                                      key={item.id}
                                      href={href}
                                      className={`group relative flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left ${rowBase} ${
                                        isCurrentItem
                                          ? 'bg-gray-100 ring-1 ring-gray-300'
                                          : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <span
                                        className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
                                          item.done
                                            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600'
                                            : isCurrentItem
                                              ? 'border-emerald-500 text-emerald-600'
                                              : isNext
                                                ? 'border-amber-500 text-amber-600'
                                                : 'border-gray-300 text-transparent'
                                        }`}
                                      >
                                        {item.done ? (
                                          <Check className="h-3 w-3" />
                                        ) : isCurrentItem ? (
                                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        ) : null}
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span
                                          className={`block truncate text-xs ${
                                            isCurrentItem || isNext
                                              ? 'font-semibold text-gray-900'
                                              : item.done
                                                ? 'font-medium text-gray-500'
                                                : 'font-medium text-gray-800'
                                          }`}
                                        >
                                          {item.title}
                                        </span>
                                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                          <span className="opacity-80">{getItemIcon(item.type)}</span>
                                          <span>{typeLabel(item.type)}</span>
                                          {isNext && (
                                            <span className="ml-0.5 rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-medium text-amber-700">
                                              Up next
                                            </span>
                                          )}
                                        </span>
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto shrink-0 border-t p-2">
        {courseComplete && nextCourse && (
          <Link
            href={`/learn/${nextCourse.id}`}
            className="mb-1 flex items-center gap-2.5 rounded-lg bg-emerald-600 px-2.5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <span className="min-w-0 flex-1 truncate">Next course: {nextCourse.title}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Link>
        )}
        <Link
          href="/learn"
          onClick={onClose}
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 ${rowBase} hover:bg-gray-100`}
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gray-100">
            <Home className="h-3.5 w-3.5" />
          </span>
          All Courses
        </Link>
      </div>
    </aside>
  );
}

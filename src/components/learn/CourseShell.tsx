'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen, ArrowRight, PartyPopper } from 'lucide-react';
import { CourseDrawer, type DrawerCourse } from './CourseDrawer';

type Props = {
  course: DrawerCourse;
  nextCourse: { id: string; title: string } | null;
  courseComplete: boolean;
  children: React.ReactNode;
};

export function CourseShell({ course, nextCourse, courseComplete, children }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex items-start gap-4">
      {open && (
        <div className="sticky top-24 w-72 shrink-0 self-start">
          <div className="h-[calc(100vh-8rem)]">
            <CourseDrawer
              course={course}
              nextCourse={nextCourse}
              courseComplete={courseComplete}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            title={open ? 'Hide course panel' : 'Show course panel'}
          >
            {open ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
            {open ? 'Hide' : 'Course'}
          </button>
        </div>

        {courseComplete && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <PartyPopper className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold text-emerald-900">Course completed</div>
                <div className="text-sm text-emerald-700">
                  Great work — you finished every module.
                </div>
              </div>
            </div>
            {nextCourse ? (
              <Link
                href={`/learn/${nextCourse.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                Next course: {nextCourse.title}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="text-sm font-medium text-emerald-700">
                You&apos;ve completed all available courses 🎉
              </span>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

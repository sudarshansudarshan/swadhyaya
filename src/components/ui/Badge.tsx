import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeTone = 'emerald' | 'violet' | 'amber' | 'rose' | 'sky' | 'slate' | 'gold';

const toneClasses: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200/70',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200/70',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200/70',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200/70',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200/70',
  gold: 'bg-amber-50 text-amber-700 ring-amber-300/60',
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  icon?: React.ReactNode;
};

export function Badge({ className, tone = 'slate', icon, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

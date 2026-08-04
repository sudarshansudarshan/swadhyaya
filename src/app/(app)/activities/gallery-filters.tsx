'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityKind } from '@/lib/activities';

type Props = {
  activeKind: ActivityKind | 'all';
  query: string;
  counts: Record<ActivityKind | 'all', number>;
  kinds: ActivityKind[];
  kindLabels: Record<ActivityKind, { label: string; tone: 'emerald' | 'violet' | 'amber' | 'sky' | 'rose' }>;
};

const toneClasses: Record<string, string> = {
  emerald: 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100',
  violet: 'border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100',
  amber: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100',
  sky: 'border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100',
  rose: 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100',
};

export function GalleryFilters({ activeKind, query, counts, kinds, kindLabels }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(query);

  function setKind(kind: ActivityKind | 'all') {
    const next = new URLSearchParams(sp.toString());
    if (kind === 'all') next.delete('kind');
    else next.set('kind', kind);
    startTransition(() => {
      router.push(`/activities?${next.toString()}`);
    });
  }

  function submitQuery(value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set('q', value);
    else next.delete('q');
    setQ(value);
    startTransition(() => {
      router.push(`/activities?${next.toString()}`);
    });
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuery(q);
        }}
        className="flex items-center gap-2"
      >
        <div className="group relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, figure, or topic…"
            className="w-full rounded-xl border border-[var(--paper-line)]/60 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          {q && (
            <button
              type="button"
              onClick={() => submitQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setKind('all')}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
            activeKind === 'all'
              ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
              : 'border-[var(--paper-line)] bg-white text-[var(--ink-soft)] hover:border-[var(--ink-soft)] hover:text-[var(--ink)]',
          )}
        >
          All <span className="ml-1 opacity-60">({counts.all})</span>
        </button>
        {kinds.map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
              activeKind === k
                ? toneClasses[kindLabels[k].tone] + ' ring-2 ring-offset-1 ring-current/20'
                : 'border-[var(--paper-line)] bg-white text-[var(--ink-soft)] hover:border-[var(--ink-soft)] hover:text-[var(--ink)]',
            )}
          >
            {kindLabels[k].label}{' '}
            <span className="ml-1 opacity-60">({counts[k] ?? 0})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

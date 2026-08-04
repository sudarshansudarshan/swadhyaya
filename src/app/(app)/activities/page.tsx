import Link from 'next/link';
import { Search, ExternalLink, Sparkles, BookOpen } from 'lucide-react';
import { ACTIVITIES, KIND_LABELS, type ActivityKind } from '@/lib/activities';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { GalleryFilters } from './gallery-filters';

const KIND_ORDER: ActivityKind[] = ['intuition', 'linear-algebra', 'systems', 'markov', 'cryptography'];

export const metadata = {
  title: 'Activity Gallery',
  description: 'Browse all 37 interactive activities in the Linear Algebra course.',
};

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sp = await searchParams;
  const filterKind: ActivityKind | 'all' = (KIND_ORDER as readonly string[]).includes(sp.kind ?? '')
    ? (sp.kind as ActivityKind)
    : 'all';
  const query = (sp.q || '').toLowerCase().trim();

  const filtered = ACTIVITIES.filter((a) => {
    if (filterKind !== 'all' && a.kind !== filterKind) return false;
    if (query) {
      const hay = `${a.title} ${a.figure} ${a.topic} ${a.short}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  const counts: Record<ActivityKind | 'all', number> = { all: ACTIVITIES.length } as Record<
    ActivityKind | 'all',
    number
  >;
  for (const a of ACTIVITIES) {
    counts[a.kind] = (counts[a.kind] ?? 0) + 1;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4 animate-fade-up">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/learn"
            className="text-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            ← Learn
          </Link>
          <span className="text-[var(--paper-line)]">/</span>
          <span className="font-medium text-[var(--ink)]">Activity Gallery</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="violet" className="mb-3" icon={<Sparkles className="h-3 w-3" />}>
              {ACTIVITIES.length} interactive widgets
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
              Activity gallery
            </h1>
            <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">
              Every interactive widget from the Linear Algebra course. Open any one in a
              new tab — it works without an account, too.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--paper-line)]/60 bg-white px-3 py-1.5 text-xs text-[var(--ink-soft)]">
            <BookOpen className="h-3.5 w-3.5" />
            Each activity opens in its own tab with a live progress bar.
          </div>
        </div>
      </header>

      <GalleryFilters
        activeKind={filterKind}
        query={query}
        counts={counts}
        kinds={KIND_ORDER}
        kindLabels={KIND_LABELS}
      />

      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <Card padding="lg" className="col-span-full text-center">
            <Search className="mx-auto h-10 w-10 text-[var(--ink-soft)]" />
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              No activities match this filter.
            </p>
            <Link
              href="/activities"
              className="mt-3 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Clear filters
            </Link>
          </Card>
        ) : (
          filtered.map((a) => {
            const tone = KIND_LABELS[a.kind].tone;
            return (
              <Card key={a.slug} padding="md" interactive className="group flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={tone}>{KIND_LABELS[a.kind].label}</Badge>
                  <span className="text-xs text-[var(--ink-soft)]">~ {a.minutes} min</span>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-tight text-[var(--ink)] line-clamp-2">
                  {a.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-[var(--ink-soft)]">{a.short}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      tone === 'emerald'
                        ? 'bg-emerald-100 text-emerald-700'
                        : tone === 'violet'
                          ? 'bg-violet-100 text-violet-700'
                          : tone === 'amber'
                            ? 'bg-amber-100 text-amber-700'
                            : tone === 'sky'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold">{a.figure.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-medium text-[var(--ink)]">{a.figure}</span>
                  <span>·</span>
                  <span className="truncate">{a.topic}</span>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button
                    href={`/activity/${a.slug}`}
                    size="sm"
                    className="flex-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

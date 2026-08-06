import Link from 'next/link';
import { ACTIVITIES, KIND_LABELS, type ActivityKind } from '@/lib/activities';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';

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

  return (
    <div className="space-y-6">
      <div className="welcome-box" style={{ paddingTop: 0, paddingBottom: 0, textAlign: 'left' }}>
        <p className="custom-section-label">{ACTIVITIES.length} interactive widgets</p>
        <h1 style={{ textAlign: 'left' }}>Activity gallery</h1>
        <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>
          Every interactive widget from the Linear Algebra course. Open any one in a
          new tab — it works without an account, too.
        </p>
      </div>

      <form
        action="/activities"
        method="GET"
        className="search-bar-row"
        style={{ justifyContent: 'flex-start', marginBottom: 12 }}
      >
        {filterKind !== 'all' && <input type="hidden" name="kind" value={filterKind} />}
        <input
          type="text"
          name="q"
          className="search-bar"
          placeholder="Search by title, figure, or topic…"
          defaultValue={query}
        />
      </form>

      <div className="radio-group" style={{ marginBottom: 0, justifyContent: 'flex-start' }}>
        <Link href="/activities" className="radio-pill" style={{ textDecoration: 'none' }}>
          <span style={{ opacity: filterKind === 'all' ? 1 : 0.6 }}>All ({ACTIVITIES.length})</span>
        </Link>
        {KIND_ORDER.map((k) => {
          const count = ACTIVITIES.filter((a) => a.kind === k).length;
          const params = new URLSearchParams();
          params.set('kind', k);
          if (query) params.set('q', query);
          return (
            <Link
              key={k}
              href={`/activities?${params.toString()}`}
              className={`radio-pill ${filterKind === k ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              {KIND_LABELS[k]} ({count})
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', marginTop: 24 }}>
          <p className="subtitle" style={{ marginBottom: 16 }}>No activities match this filter.</p>
          <Link href="/activities" style={{ textDecoration: 'none' }}>
            <button className="secondary">Clear filters</button>
          </Link>
        </div>
      ) : (
        <div className="menu-grid">
          {filtered.map((a) => (
            <Link
              key={a.slug}
              href={`/activity/${a.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="menu-card"
              style={{ textDecoration: 'none' }}
            >
              <div className="menu-title">{a.figure}</div>
              <div className="menu-subtitle">
                {KIND_LABELS[a.kind]} · ~{a.minutes} min
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
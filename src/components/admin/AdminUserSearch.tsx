'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

type Result = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  cohort: { name: string } | null;
};

export function AdminUserSearch({
  cohorts,
  courses,
}: {
  cohorts: { id: string; name: string }[];
  courses: { id: string; title: string }[];
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-4 py-3 border rounded-xl bg-white">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, email, or samagama.in sub…"
          className="bg-transparent outline-none flex-1 text-base"
        />
        {loading && <span className="text-sm text-muted-foreground">…</span>}
      </div>

      {results.length > 0 && (
        <div className="bg-white border rounded-xl divide-y">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/admin/users/${r.id}`}
              className="flex items-center gap-3 p-3 hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="font-medium">{r.name ?? r.email}</div>
                <div className="text-sm text-muted-foreground">{r.email}</div>
              </div>
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{r.role}</span>
              {r.cohort && <span className="text-xs text-muted-foreground">{r.cohort.name}</span>}
            </Link>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !loading && (
        <div className="p-6 bg-white border rounded-xl text-center text-muted-foreground">
          No users found for "{query}"
        </div>
      )}

      {query.length < 2 && (
        <div className="p-6 bg-white border rounded-xl text-muted-foreground text-sm">
          Type 2+ characters to search. Search by name, email, or samagama.in sub.
        </div>
      )}
    </div>
  );
}

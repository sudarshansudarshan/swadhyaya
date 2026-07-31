'use client';

import { useState } from 'react';
import { useLiveChannel } from '@/hooks/useLiveChannel';
import { Search } from 'lucide-react';
import Link from 'next/link';

type Event = {
  id: string;
  type: string;
  severity: string;
  actorId?: string;
  userId?: string;
  userName?: string;
  instructorId?: string;
  metadata?: any;
  createdAt: string;
};

const severityColor: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  warn: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
};

export function ActivityFeed() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  useLiveChannel('admin-activity', ({ event, payload }) => {
    if (event === 'log') {
      setEvents((prev) => [payload, ...prev].slice(0, 500));
    }
  });

  const filtered = events
    .filter((e) => (filter === 'all' ? true : e.severity === filter))
    .filter((e) => (query ? e.type.includes(query) : true));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">{events.length} events captured this session</p>
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-2 px-3 py-2 border rounded-lg flex-1 max-w-md bg-white">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by type…"
            className="bg-transparent outline-none flex-1 text-sm"
          />
        </div>
        {(['all', 'info', 'warn', 'error'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded-full border ${
              filter === f ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-white text-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-xl divide-y">
        {filtered.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">No events yet.</div>
        )}
        {filtered.map((e) => (
          <div key={e.id} className="p-3 flex items-center gap-3 hover:bg-gray-50">
            <span className={`px-2 py-0.5 text-xs rounded ${severityColor[e.severity] ?? 'bg-gray-100'}`}>
              {e.severity}
            </span>
            <span className="text-xs text-muted-foreground w-20">
              {new Date(e.createdAt).toLocaleTimeString()}
            </span>
            <span className="font-mono text-xs flex-1">{e.type}</span>
            {e.userId && (
              <Link
                href={`/admin/users/${e.userId}`}
                className="text-xs text-emerald-600 hover:underline"
              >
                view user
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

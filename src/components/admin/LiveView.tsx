'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLiveChannel } from '@/hooks/useLiveChannel';
import { Activity as ActivityIcon, Eye, Video, ClipboardCheck, Gamepad2 } from 'lucide-react';

type LiveUser = {
  userId: string;
  userName: string | null;
  userEmail: string;
  page: string;
  videoTimestamp?: number;
  quizQuestion?: number;
  quizScore?: number;
  itemType?: string;
  lastHeartbeat: number;
};

const ACTIVE_THRESHOLD = 30_000;
const IDLE_THRESHOLD = 120_000;

function tileColor(age: number): string {
  if (age < ACTIVE_THRESHOLD) return 'bg-emerald-500';
  if (age < IDLE_THRESHOLD) return 'bg-amber-500';
  return 'bg-gray-400';
}

function tileAge(age: number): string {
  if (age < 60_000) return `${Math.floor(age / 1000)}s`;
  if (age < 3_600_000) return `${Math.floor(age / 60_000)}m`;
  return `${Math.floor(age / 3_600_000)}h`;
}

export function LiveView() {
  const [users, setUsers] = useState<Map<string, LiveUser>>(new Map());
  const [filter, setFilter] = useState<'all' | 'video' | 'quiz' | 'activity' | 'idle'>('all');

  useLiveChannel('admin-live', ({ event, payload }) => {
    if (event === 'heartbeat') {
      setUsers((prev) => {
        const next = new Map(prev);
        next.set(payload.userId, { ...payload, lastHeartbeat: Date.now() });
        return next;
      });
    } else if (event === 'disconnect') {
      setUsers((prev) => {
        const next = new Map(prev);
        next.delete(payload.userId);
        return next;
      });
    }
  });

  useEffect(() => {
    const tick = setInterval(() => {
      setUsers((prev) => {
        const now = Date.now();
        const next = new Map();
        for (const [id, u] of prev) {
          if (now - u.lastHeartbeat < 5 * 60_000) {
            next.set(id, u);
          }
        }
        return next;
      });
    }, 5_000);
    return () => clearInterval(tick);
  }, []);

  const list = Array.from(users.values()).filter((u) => {
    if (filter === 'video') return u.itemType === 'VIDEO';
    if (filter === 'quiz') return u.itemType === 'QUIZ';
    if (filter === 'activity') return u.itemType === 'ACTIVITY';
    if (filter === 'idle') return Date.now() - u.lastHeartbeat > IDLE_THRESHOLD;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live View</h1>
          <p className="text-muted-foreground">{list.length} active user(s)</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'video', 'quiz', 'activity', 'idle'] as const).map((f) => (
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {list.map((u) => {
          const age = Date.now() - u.lastHeartbeat;
          const Icon = u.itemType === 'VIDEO' ? Video : u.itemType === 'QUIZ' ? ClipboardCheck : u.itemType === 'ACTIVITY' ? Gamepad2 : ActivityIcon;
          return (
            <Link
              key={u.userId}
              href={`/admin/users/${u.userId}`}
              className="p-3 bg-white border rounded-xl hover:shadow-md transition"
            >
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${tileColor(age)}`} />
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{tileAge(age)}</span>
              </div>
              <div className="mt-1 text-sm font-medium truncate">{u.userName ?? u.userEmail}</div>
              <div className="text-xs text-muted-foreground truncate">{u.page}</div>
              {u.videoTimestamp !== undefined && (
                <div className="text-xs text-blue-600 mt-1">⏱ {Math.floor(u.videoTimestamp)}s</div>
              )}
              {u.quizQuestion !== undefined && (
                <div className="text-xs text-emerald-600 mt-1">
                  Q{u.quizQuestion} · {u.quizScore}/
                  {u.quizQuestion ? '20' : ''}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {list.length === 0 && (
        <div className="p-8 bg-white border rounded-xl text-center text-muted-foreground">
          No users match the current filter.
        </div>
      )}
    </div>
  );
}

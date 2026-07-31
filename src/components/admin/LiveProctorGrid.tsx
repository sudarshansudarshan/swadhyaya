'use client';

import { useEffect, useState } from 'react';
import { useLiveChannel } from '@/hooks/useLiveChannel';
import { Shield } from 'lucide-react';

type Session = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  itemId: string;
  penaltyScore: number;
  ejected: boolean;
};

export function LiveProctorGrid() {
  const [sessions, setSessions] = useState<Map<string, Session>>(new Map());

  useLiveChannel('admin-proctor', ({ event, payload }) => {
    if (event === 'session-start' || event === 'session-update') {
      setSessions((prev) => {
        const next = new Map(prev);
        next.set(payload.id, payload);
        return next;
      });
    }
    if (event === 'session-end') {
      setSessions((prev) => {
        const next = new Map(prev);
        next.delete(payload.id);
        return next;
      });
    }
  });

  useEffect(() => {
    const tick = setInterval(() => {
      setSessions((prev) => new Map(prev));
    }, 5000);
    return () => clearInterval(tick);
  }, []);

  const list = Array.from(sessions.values());

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" /> Live Proctor Sessions
        </h2>
        <span className="text-sm text-muted-foreground">{list.length} active</span>
      </div>
      {list.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground text-sm">No active proctor sessions.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((s) => (
            <div key={s.id} className={`p-3 border rounded-lg ${s.ejected ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="text-sm font-medium truncate">{s.userName ?? s.userEmail}</div>
              <div className="text-xs text-muted-foreground mt-1">
                penalty: {s.penaltyScore} · {s.ejected ? '🚫 EJECTED' : '✓ OK'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

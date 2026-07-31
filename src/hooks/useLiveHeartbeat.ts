'use client';

import { useEffect, useRef } from 'react';

export type HeartbeatData = {
  page: string;
  videoTimestamp?: number;
  quizQuestion?: number;
  quizScore?: number;
  itemId?: string;
  itemType?: 'VIDEO' | 'ACTIVITY' | 'QUIZ';
  proctorSessionId?: string;
  isFullscreen?: boolean;
  readyToDetect?: boolean;
};

const HEARTBEAT_INTERVAL = 10_000;

export function useLiveHeartbeat(getData: () => HeartbeatData | null) {
  const lastSent = useRef<HeartbeatData | null>(null);

  useEffect(() => {
    const send = async () => {
      const data = getData();
      if (!data) return;
      try {
        await fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        lastSent.current = data;
      } catch {}
    };

    send();
    const id = setInterval(send, HEARTBEAT_INTERVAL);

    const handleUnload = () => {
      navigator.sendBeacon?.('/api/heartbeat', JSON.stringify({ _clear: true }));
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(id);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [getData]);
}

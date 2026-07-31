'use client';

import { useEffect, useRef, useCallback } from 'react';

type Props = {
  enabled?: boolean;
  onIdle?: (data: { idleSeconds: number }) => void;
  idleTimeout?: number;
};

export function useScreenActivity({ enabled = false, onIdle, idleTimeout = 45 }: Props) {
  const lastActivityRef = useRef<number | null>(null);
  const idleReportedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onRef = useRef(onIdle);

  useEffect(() => {
    onRef.current = onIdle;
  }, [onIdle]);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    idleReportedRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    const handlers = activityEvents.map((evt) => {
      const handler = () => resetActivity();
      window.addEventListener(evt, handler);
      return { evt, handler };
    });

    intervalRef.current = setInterval(() => {
      const idleFor = Math.floor((Date.now() - (lastActivityRef.current ?? Date.now())) / 1000);
      if (idleFor >= idleTimeout && !idleReportedRef.current) {
        idleReportedRef.current = true;
        onRef.current?.({ idleSeconds: idleFor });
      }
    }, 5000);

    return () => {
      handlers.forEach(({ evt, handler }) => window.removeEventListener(evt, handler));
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, idleTimeout, resetActivity]);
}

'use client';

import { useEffect, useRef, useState } from 'react';

export type ChannelEvent = {
  event: string;
  payload: any;
  ts?: number;
};

export function useLiveChannel(channel: string | null, onEvent?: (evt: ChannelEvent) => void) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<ChannelEvent | null>(null);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!channel) return;

    const es = new EventSource(`/api/realtime/${channel}`);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const evt: ChannelEvent = {
          event: data.event ?? 'message',
          payload: data.payload,
          ts: data.ts,
        };
        setLastEvent(evt);
        handlerRef.current?.(evt);
      } catch {}
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [channel]);

  return { connected, lastEvent };
}

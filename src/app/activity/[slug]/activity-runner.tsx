'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type Props = {
  slug: string;
  title: string;
  figure: string;
  topic: string;
  itemId: string | null;
  minSeconds: number;
  returnHref: string | null;
};

const STORAGE_PREFIX = 'swadhyaya.activity.';
const CHANNEL_PREFIX = 'swadhyaya.activity.';

type ActivityMessage = {
  type: 'activity-progress' | 'activity-complete' | 'activity-opened';
  slug: string;
  itemId?: string;
  seconds: number;
  at: number;
};

export function ActivityRunner({
  slug,
  title,
  figure,
  topic,
  itemId,
  minSeconds,
  returnHref,
}: Props) {
  const [seconds, setSeconds] = useState(0);
  const [complete, setComplete] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [focused, setFocused] = useState(true);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const key = `${STORAGE_PREFIX}${slug}`;
  const messageItemId = itemId ?? undefined;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored) as { seconds: number; at: number };
        const elapsedSince = Math.floor((Date.now() - data.at) / 1000);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSeconds(Math.max(0, data.seconds + Math.min(elapsedSince, 30)));
      }
    } catch {}
  }, [key]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(`${CHANNEL_PREFIX}${slug}`);
    channelRef.current = ch;

    ch.onmessage = (e: MessageEvent<ActivityMessage>) => {
      if (e.data?.type === 'activity-opened') {
        ch.postMessage({
          type: 'activity-progress',
          slug,
          itemId: messageItemId,
          seconds,
          at: Date.now(),
        } satisfies ActivityMessage);
      }
    };

    ch.postMessage({
      type: 'activity-opened',
      slug,
      itemId: messageItemId,
      seconds: 0,
      at: Date.now(),
    } satisfies ActivityMessage);

    return () => {
      ch.close();
    };
  }, [slug, itemId, seconds, messageItemId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSeconds((s) => {
        const next = focused ? s + 1 : s;
        try {
          window.localStorage.setItem(
            key,
            JSON.stringify({ seconds: next, at: Date.now() }),
          );
        } catch {}
        channelRef.current?.postMessage({
          type: 'activity-progress',
          slug,
          itemId: messageItemId,
          seconds: next,
          at: Date.now(),
        } satisfies ActivityMessage);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [key, slug, itemId, messageItemId, focused]);

  useEffect(() => {
    const onVis = () => setFocused(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    function onUnload() {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              type: 'activity-progress',
              slug,
              itemId: messageItemId,
              seconds,
              at: Date.now(),
            } satisfies ActivityMessage,
            window.location.origin,
          );
        }
      } catch {}
    }
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [slug, itemId, seconds, messageItemId]);

  useEffect(() => {
    function onMessage(e: MessageEvent<ActivityMessage>) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'activity-opened' && e.data.slug === slug) {
        window.opener?.postMessage(
          {
            type: 'activity-progress',
            slug,
            itemId: messageItemId,
            seconds,
            at: Date.now(),
          } satisfies ActivityMessage,
          window.location.origin,
        );
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [slug, itemId, seconds, messageItemId]);

  const meetsTime = seconds >= minSeconds;

  const markComplete = useCallback(() => {
    setComplete(true);
    const payload: ActivityMessage = {
      type: 'activity-complete',
      slug,
      itemId: messageItemId,
      seconds,
      at: Date.now(),
    };
    channelRef.current?.postMessage(payload);
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, window.location.origin);
      }
    } catch {}
    try {
      window.localStorage.setItem(
        `${STORAGE_PREFIX}completed.${slug}`,
        JSON.stringify({ at: Date.now(), seconds }),
      );
    } catch {}
  }, [slug, seconds, messageItemId]);

  const handleReturn = useCallback(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
      window.close();
    } else if (returnHref) {
      window.location.href = returnHref;
    } else {
      window.close();
    }
  }, [returnHref]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && meetsTime && !complete) {
        e.preventDefault();
        markComplete();
      }
      if (e.key === 'Escape') {
        setCollapsed((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [meetsTime, complete, markComplete]);

  if (collapsed) {
    return (
      <button
        type="button"
        className="theme-toggle"
        style={{ width: 'auto', borderRadius: 999, padding: '6px 12px', fontSize: '0.78rem' }}
        onClick={() => setCollapsed(false)}
      >
        {figure} · {formatTime(seconds)}
      </button>
    );
  }

  return (
    <>
      <div className="app-shell" style={{ alignItems: 'flex-start', paddingTop: 0, paddingBottom: 0, minHeight: 'unset' }}>
        <div className="card is-wide" style={{ maxWidth: '100%', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--clr-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-soft)' }}>
              {figure} · {topic}
            </div>
          </div>
          <span className="timer-pill">{formatTime(seconds)} / {formatTime(minSeconds)}</span>
          {!complete ? (
            <button
              type="button"
              onClick={markComplete}
              disabled={!meetsTime}
              className="secondary"
              style={{ height: 36 }}
            >
              {meetsTime ? 'Mark complete' : `${formatTime(Math.max(0, minSeconds - seconds))} to go`}
            </button>
          ) : (
            <button type="button" onClick={handleReturn} style={{ height: 36 }}>
              Return
            </button>
          )}
        </div>
        <div style={{ height: 16 }} />
      </div>

      <iframe
        src={`/activities/${slug}.html`}
        title={title}
        style={{
          position: 'fixed',
          inset: '76px 0 0 0',
          width: '100%',
          border: 0,
          background: 'var(--clr-bg)',
        }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
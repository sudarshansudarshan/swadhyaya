'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Maximize2,
  PartyPopper,
  Shield,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

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

  // Restore prior elapsed time from localStorage so a refresh doesn't reset the timer
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

  // BroadcastChannel for cross-tab sync with the launcher
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

    // Tell the launcher tab that we're here
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

  // Timer
  useEffect(() => {
    const id = window.setInterval(() => {
      setSeconds((s) => {
        const next = focused ? s + 1 : s;
        // persist
        try {
          window.localStorage.setItem(
            key,
            JSON.stringify({ seconds: next, at: Date.now() }),
          );
        } catch {}
        // broadcast progress
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

  // Track focus so we don't count the timer when the user is in another tab
  useEffect(() => {
    const onVis = () => setFocused(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Also post to window.opener (in case the launcher is the parent window, not a peer)
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

  // Listen for messages from window.opener (the launcher)
  useEffect(() => {
    function onMessage(e: MessageEvent<ActivityMessage>) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'activity-opened' && e.data.slug === slug) {
        // respond
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
  const pct = Math.min(100, Math.round((seconds / minSeconds) * 100));

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

  const reset = useCallback(() => {
    setComplete(false);
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }, [key]);

  // Keyboard: Cmd/Ctrl+Enter to mark complete, Escape to collapse the bar
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
        onClick={() => setCollapsed(false)}
        className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-emerald-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[var(--ink)] shadow-lg backdrop-blur hover:scale-105 transition"
        title="Show activity bar (Esc)"
      >
        <Maximize2 className="h-3.5 w-3.5 text-[var(--primary)]" />
        {figure}
        <span className="text-[var(--ink-soft)]">·</span>
        <span className="font-mono">{formatTime(seconds)}</span>
        {meetsTime && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 border-b border-[var(--paper-line)]/60 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-6">
          <Logo />
          <span className="hidden h-5 w-px bg-[var(--paper-line)] sm:inline-block" />
          <div className="hidden min-w-0 flex-1 sm:block">
            <div className="truncate text-sm font-semibold text-[var(--ink)]">{title}</div>
            <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
              <Sparkles className="h-3 w-3" />
              <span>{figure}</span>
              <span>·</span>
              <span className="truncate">{topic}</span>
            </div>
          </div>
          <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:flex-none sm:gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-[var(--paper)]/60 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 text-[var(--ink-soft)]" />
              <div className="text-xs">
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {formatTime(seconds)}
                </span>
                <span className="text-[var(--ink-soft)]"> / {formatTime(minSeconds)}</span>
              </div>
            </div>

            <div className="hidden h-9 w-24 overflow-hidden rounded-lg bg-[var(--paper)] sm:block">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            {!complete ? (
              <button
                onClick={markComplete}
                disabled={!meetsTime}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500"
                title="Cmd/Ctrl + Enter"
              >
                {meetsTime ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark complete
                  </>
                ) : (
                  <>
                    <Target className="h-3.5 w-3.5" />
                    {formatTime(Math.max(0, minSeconds - seconds))} to go
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleReturn}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Return to Swadhyaya
              </button>
            )}

            <button
              onClick={() => setCollapsed(true)}
              className="rounded-md p-1.5 text-[var(--ink-soft)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              title="Hide bar (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-14" aria-hidden />

      {complete && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-emerald-200 bg-white px-5 py-2.5 shadow-2xl animate-fade-up">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <PartyPopper className="h-3.5 w-3.5" />
            </div>
            <div className="text-sm">
              <div className="font-semibold text-[var(--ink)]">Activity complete!</div>
              <div className="text-xs text-[var(--ink-soft)]">
                Your launcher tab has been updated.
              </div>
            </div>
            <button
              onClick={handleReturn}
              className="ml-2 rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Return
            </button>
            <button
              onClick={reset}
              className="text-xs text-[var(--ink-soft)] underline-offset-2 hover:underline"
            >
              redo
            </button>
          </div>
        </div>
      )}

      <iframe
        src={`/activities/${slug}.html`}
        title={title}
        className="fixed inset-x-0 bottom-0 top-14 w-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />

      <noscript>
        <div className="p-8 text-center">
          <Shield className="mx-auto h-8 w-8 text-amber-600" />
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            JavaScript is required for the timer to track your progress.
          </p>
        </div>
      </noscript>
    </>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

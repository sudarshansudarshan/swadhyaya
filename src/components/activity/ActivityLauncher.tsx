'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  Target,
  Timer,
} from 'lucide-react';
import { Card, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Confetti } from '@/components/ui/Confetti';
import { getActivity, KIND_LABELS } from '@/lib/activities';
import { cn } from '@/lib/utils';

type Props = {
  slug: string;
  minSeconds?: number;
  itemId?: string;
  alreadyComplete?: boolean;
  onComplete: () => void | Promise<void>;
};

const STORAGE_PREFIX = 'swadhyaya.activity.';

type ActivityMessage = {
  type: 'activity-progress' | 'activity-complete' | 'activity-opened';
  slug: string;
  itemId?: string;
  seconds: number;
  at: number;
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec.toString().padStart(2, '0')}s` : `${sec}s`;
}

export function ActivityLauncher({
  slug,
  minSeconds = 60,
  itemId,
  alreadyComplete = false,
  onComplete,
}: Props) {
  const meta = getActivity(slug);
  const [seconds, setSeconds] = useState(0);
  const [windowOpen, setWindowOpen] = useState(false);
  const [externalComplete, setExternalComplete] = useState(alreadyComplete);
  const [submitting, setSubmitting] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const childRef = useRef<Window | null>(null);
  const tickRef = useRef<number | null>(null);

  // Restore stored seconds on mount (so refresh doesn't reset)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
      if (stored) {
        const data = JSON.parse(stored) as { seconds: number; at: number };
        const elapsedSince = Math.floor((Date.now() - data.at) / 1000);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSeconds(Math.max(0, data.seconds + Math.min(elapsedSince, 30)));
      }
    } catch {}
  }, [slug]);

  // Subscribe to BroadcastChannel for progress updates from the activity tab
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(`${STORAGE_PREFIX}${slug}`);
    channelRef.current = ch;
    ch.onmessage = (e: MessageEvent<ActivityMessage>) => {
      if (!e.data) return;
      if (e.data.slug !== slug) return;
      if (e.data.type === 'activity-progress') {
        setSeconds(Math.max(seconds, e.data.seconds));
      }
      if (e.data.type === 'activity-complete') {
        setExternalComplete(true);
        setSeconds((s) => Math.max(s, e.data.seconds));
        setConfetti(true);
      }
    };
    return () => {
      ch.close();
    };
  }, [slug, seconds]);

  // Also listen for window.postMessage from the activity tab (fallback for browsers
  // without BroadcastChannel, or for the case where the tab was opened by a different click)
  useEffect(() => {
    function onMsg(e: MessageEvent<ActivityMessage>) {
      if (e.origin !== window.location.origin) return;
      if (!e.data || e.data.slug !== slug) return;
      if (e.data.type === 'activity-progress') {
        setSeconds((s) => Math.max(s, e.data!.seconds));
      }
      if (e.data.type === 'activity-complete') {
        setExternalComplete(true);
        setSeconds((s) => Math.max(s, e.data!.seconds));
        setConfetti(true);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [slug]);

  // Detect when the activity tab is closed
  useEffect(() => {
    if (!windowOpen) return;
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      // we don't have a direct handle, but a BroadcastChannel ping helps
    }, 1500);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [windowOpen]);

  const meetsTime = seconds >= minSeconds;
  const pct = Math.min(100, Math.round((seconds / minSeconds) * 100));
  const tone = meta ? KIND_LABELS[meta.kind].tone : 'amber';
  const toneClasses: Record<string, { bg: string; text: string; ring: string }> = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' },
    sky: { bg: 'bg-sky-100', text: 'text-sky-700', ring: 'ring-sky-200' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200' },
  };
  const t = toneClasses[tone] ?? toneClasses.amber;

  const openActivity = useCallback(() => {
    const params = new URLSearchParams();
    if (itemId) params.set('itemId', itemId);
    params.set('min', String(minSeconds));
    const url = `/activity/${slug}?${params.toString()}`;
    const win = window.open(url, `swadhyaya-activity-${slug}`, 'noopener,noreferrer');
    if (win) {
      childRef.current = win;
      setWindowOpen(true);
    }
  }, [slug, itemId, minSeconds]);

  const markComplete = useCallback(async () => {
    setSubmitting(true);
    try {
      await onComplete();
      setExternalComplete(true);
      setConfetti(true);
    } finally {
      setSubmitting(false);
    }
  }, [onComplete]);

  if (!meta) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        Activity <code className="font-mono">{slug}</code> not found.
      </div>
    );
  }

  if (alreadyComplete || externalComplete) {
    return (
      <Card padding="md" className="border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[var(--ink)]">Activity complete</div>
            <CardDescription className="mt-0.5">{meta.title}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={openActivity}
            className="text-[var(--ink-soft)]"
          >
            Re-open
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Confetti trigger={confetti} onDone={() => setConfetti(false)} />
      <Card padding="none" className="overflow-hidden">
        <div className="grid gap-0 sm:grid-cols-5">
          {/* Preview pane */}
          <div className="relative col-span-3 border-b border-[var(--paper-line)]/60 bg-gradient-to-br from-[var(--paper)] to-white p-6 sm:border-b-0 sm:border-r sm:p-7">
            <div className="flex items-center gap-2">
              <Badge tone={tone} icon={<Sparkles className="h-3 w-3" />}>
                {KIND_LABELS[meta.kind].label}
              </Badge>
              <span className="text-xs text-[var(--ink-soft)]">~ {meta.minutes} min</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold leading-tight text-[var(--ink)] sm:text-3xl">
              {meta.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{meta.short}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-soft)]">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full ring-2',
                  t.bg,
                  t.text,
                  t.ring,
                )}
              >
                <span className="text-[10px] font-bold">
                  {meta.figure.charAt(0).toUpperCase()}
                </span>
              </div>
              <span>Introduced by {meta.figure}</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={openActivity} size="md" variant="primary">
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </Button>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--paper)]/60 px-3 text-xs text-[var(--ink-soft)]">
                <kbd className="rounded border border-[var(--paper-line)] bg-white px-1.5 py-0.5 text-[10px] font-mono">
                  Esc
                </kbd>
                collapses the bar
              </span>
            </div>
          </div>

          {/* Live progress pane */}
          <div className="col-span-2 flex flex-col gap-4 p-6 sm:p-7">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                <Timer className="h-3 w-3" />
                Your progress
              </div>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-bold tabular-nums text-[var(--ink)]">
                  {formatTime(seconds)}
                </span>
                <span className="pb-1 text-sm text-[var(--ink-soft)]">
                  / {formatTime(minSeconds)}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--paper)]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    meetsTime
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                      : 'bg-gradient-to-r from-amber-400 to-amber-500',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--ink-soft)]">
                {meetsTime ? (
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Minimum reached — you can complete
                  </span>
                ) : windowOpen ? (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Activity tab is open — timer ticking
                  </span>
                ) : (
                  <span>Click <em>Open in new tab</em> to start the timer.</span>
                )}
              </p>
            </div>

            <div className="mt-auto flex items-center gap-2 rounded-xl border border-dashed border-[var(--paper-line)] bg-[var(--paper)]/40 p-3 text-xs text-[var(--ink-soft)]">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                Time is tracked in the activity tab. If you switch away, the timer pauses.
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Completion bar */}
      <div className="flex items-center justify-between rounded-2xl border border-[var(--paper-line)]/60 bg-white p-3 pl-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl transition',
              meetsTime
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md'
                : 'bg-[var(--paper)] text-[var(--ink-soft)]',
            )}
          >
            {meetsTime ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />}
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--ink)]">
              {meetsTime ? 'Ready to mark complete' : 'Spend a few minutes first'}
            </div>
            <div className="text-xs text-[var(--ink-soft)]">
              {meetsTime
                ? 'Your launch tab will auto-update.'
                : `${formatTime(Math.max(0, minSeconds - seconds))} remaining in the activity.`}
            </div>
          </div>
        </div>
        <Button
          onClick={markComplete}
          disabled={!meetsTime || submitting}
          variant={meetsTime ? 'primary' : 'secondary'}
        >
          {submitting ? 'Saving…' : 'Mark Complete'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

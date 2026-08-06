'use client';

import { useEffect, useState, useRef } from 'react';
import { Clock, CheckCircle } from 'lucide-react';

type Props = {
  slug: string;
  minSeconds?: number;
  onComplete: () => void | Promise<void>;
};

export function ActivityFrame({ slug, minSeconds = 60, onComplete }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'activity-complete' || e.data?.completed === true) {
        setCompleted(true);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const meetsTime = seconds >= minSeconds;

  async function handleComplete() {
    setSubmitting(true);
    try {
      await onComplete();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-white border rounded-xl">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{Math.floor(seconds / 60)}m {seconds % 60}s spent</span>
          <span className="text-muted-foreground">/ {Math.floor(minSeconds / 60)}m minimum</span>
        </div>
        {meetsTime && !completed && (
          <button
            onClick={handleComplete}
            disabled={submitting}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Mark Complete'}
          </button>
        )}
        {completed && (
          <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
            <CheckCircle className="h-4 w-4" /> Complete
          </span>
        )}
      </div>

      <iframe
        src={`/activities/${slug}.html`}
        title="Interactive activity"
        className="w-full min-h-[600px] bg-white border rounded-xl"
        sandbox="allow-scripts allow-same-origin allow-forms"
        onLoad={() => { startedRef.current = true; }}
      />
    </div>
  );
}

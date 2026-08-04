'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center animate-fade-up">
        <div className="relative mx-auto inline-block">
          <div className="absolute inset-0 -m-4 animate-pulse-soft rounded-full bg-rose-200/50 blur-2xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700">
            <AlertTriangle className="h-7 w-7" />
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-[var(--ink)]">Something went wrong</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          {error.message ||
            'We hit an unexpected snag. Your progress is safe — try again in a moment.'}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-[var(--ink-soft)]">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} size="md">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button href="/dashboard" size="md" variant="secondary">
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

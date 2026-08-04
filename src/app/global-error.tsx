'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error boundary:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper-ruled">
          <div className="absolute inset-0 bg-mesh" aria-hidden />
          <div className="relative mx-auto max-w-lg px-6 text-center animate-fade-up">
            <Logo className="mx-auto justify-center" />
            <div className="mt-8 flex justify-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 -m-4 animate-pulse-soft rounded-full bg-rose-200/50 blur-2xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700">
                  <AlertTriangle className="h-7 w-7" />
                </div>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[var(--ink)]">
              Something broke on our side
            </h2>
            <p className="mt-2 text-[var(--ink-soft)]">
              {error.message ||
                'An unexpected error prevented the page from loading. We are sorry.'}
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
              <Button href="/" size="md" variant="secondary">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

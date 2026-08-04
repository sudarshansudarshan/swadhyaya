import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="absolute inset-0 animate-pulse-soft rounded-full bg-emerald-200/50 blur-xl" />
          <Loader2 className="relative h-10 w-10 animate-spin text-[var(--primary)]" />
        </div>
        <p className="mt-4 text-sm font-medium text-[var(--ink)]">Loading…</p>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Spinning up your learning space.
        </p>
      </div>
    </div>
  );
}

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-ruled">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="absolute inset-0 animate-pulse-soft rounded-full bg-emerald-200/50 blur-xl" />
          <Loader2 className="relative h-12 w-12 animate-spin text-[var(--primary)]" />
        </div>
        <p className="mt-4 text-sm font-medium text-[var(--ink)]">Loading Swadhyaya…</p>
      </div>
    </div>
  );
}

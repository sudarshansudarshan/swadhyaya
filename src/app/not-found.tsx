import { Home, Search, ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper-ruled">
      <div className="absolute inset-0 bg-mesh" aria-hidden />
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div className="absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden />
      <div className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-violet-200/40 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-2xl px-6 text-center animate-fade-up">
        <div className="relative inline-block">
          <div className="absolute inset-0 -m-8 animate-pulse-soft rounded-full bg-gradient-to-br from-emerald-200/40 via-violet-200/40 to-amber-200/40 blur-2xl" />
          <div className="relative text-[12rem] font-black leading-none tracking-tighter text-gradient sm:text-[16rem]">
            404
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[var(--primary)]">
          <Compass className="h-4 w-4 animate-spin-slow" />
          <span className="text-sm font-semibold uppercase tracking-wider">Off the path</span>
        </div>

        <h1 className="mt-2 text-3xl font-bold text-[var(--ink)] sm:text-4xl">
          This page is missing
        </h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          The section you&apos;re looking for may have been moved, deleted, or perhaps
          never existed. Let&apos;s get you back on track.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/" size="lg">
            <Home className="h-4 w-4" />
            Back to home
          </Button>
          <Button href="/dashboard" size="lg" variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Go to dashboard
          </Button>
        </div>

        <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-[var(--paper-line)]/60 bg-white/80 px-4 py-2 text-sm text-[var(--ink-soft)] backdrop-blur">
          <Search className="h-3.5 w-3.5" />
          or use the menu in the topbar to navigate
        </div>
      </div>
    </div>
  );
}

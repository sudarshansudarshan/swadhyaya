import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  Eye,
  GraduationCap,
  Library,
  Quote,
  Shield,
  Sparkles,
  Trophy,
  Video,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper-ruled">
      {/* ===================== Navigation ===================== */}
      <nav className="sticky top-0 z-30 border-b border-[var(--paper-line)]/60 bg-[var(--paper)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="#features"
              className="hidden text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] sm:inline-block"
            >
              Features
            </Link>
            <Link
              href="#how"
              className="hidden text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] sm:inline-block"
            >
              How it works
            </Link>
            <Link
              href="#testimonial"
              className="hidden text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] sm:inline-block"
            >
              Faculty
            </Link>
            <Button href="/login" size="sm" className="ml-2">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ===================== Hero ===================== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh" aria-hidden />
        <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7 animate-fade-up">
              <Badge tone="emerald" icon={<Sparkles className="h-3 w-3" />} className="mb-6">
                IIT Ropar · Linear Algebra · Spring 2026
              </Badge>
              <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight text-[var(--ink)] sm:text-6xl lg:text-7xl">
                Self-study, <br />
                <span className="text-gradient">earnestly proctored.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--ink-soft)]">
                Swadhyaya pairs every video lesson with an in-browser proctor, an
                interactive activity, and a viva with your instructor — so deep work
                gets verified, not just watched.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="/login" size="lg">
                  Sign in to continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="#features" size="lg" variant="secondary">
                  See how it works
                </Button>
              </div>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
                {[
                  { v: '1,060', l: 'Conceptual MCQs' },
                  { v: '53', l: 'Sections' },
                  { v: '6', l: 'Modules' },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="text-3xl font-bold text-[var(--ink)]">{s.v}</dt>
                    <dd className="text-sm text-[var(--ink-soft)]">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Hero illustration: stacked learning cards */}
            <div className="relative h-[420px] lg:col-span-5">
              <div className="absolute inset-0">
                <div className="absolute right-0 top-2 w-72 -rotate-3 animate-fade-up [animation-delay:0.2s]">
                  <Card padding="md" className="border-emerald-200/60 shadow-xl">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                        <Video className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Eigenvalues</div>
                        <div className="text-xs text-[var(--ink-soft)]">12:48 · watching</div>
                      </div>
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-emerald-50">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" />
                      Camera on · proctor active
                    </div>
                  </Card>
                </div>
                <div className="absolute left-0 top-32 w-72 rotate-2 animate-fade-up [animation-delay:0.4s]">
                  <Card padding="md" className="border-violet-200/60 shadow-xl">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-violet-100 p-2 text-violet-700">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Quick check</div>
                        <div className="text-xs text-[var(--ink-soft)]">5 questions</div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      {[
                        { ok: true },
                        { ok: true },
                        { ok: false },
                      ].map((q, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-md bg-[var(--muted)] px-2 py-1.5 text-xs"
                        >
                          <span
                            className={
                              q.ok
                                ? 'flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700'
                                : 'flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-rose-700'
                            }
                          >
                            {q.ok ? '✓' : '✕'}
                          </span>
                          <span className="text-[var(--ink-soft)]">Q{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
                <div className="absolute bottom-2 right-4 w-64 -rotate-1 animate-fade-up [animation-delay:0.6s]">
                  <Card padding="md" className="border-amber-200/60 shadow-xl">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Viva booked</div>
                        <div className="text-xs text-[var(--ink-soft)]">Tomorrow 16:00</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white flex items-center justify-center">
                        S
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-[var(--ink)]">Prof. Sudarshan</div>
                        <div className="text-[var(--ink-soft)]">Approved · meet link sent</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Features ===================== */}
      <section id="features" className="border-t border-[var(--paper-line)]/50 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <Badge tone="violet" className="mb-4">
              What&apos;s inside
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
              Built for the moments learning actually happens.
            </h2>
            <p className="mt-4 text-lg text-[var(--ink-soft)]">
              Five small but deliberate systems that turn a video into a verified understanding.
            </p>
          </div>

          <div className="stagger mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Video,
                tone: 'emerald' as const,
                title: 'Proctored video',
                body: 'On-device camera, face, motion, tab-switch, and voice checks. Three-strike rule, five-second fail countdown. No server-side browser magic.',
              },
              {
                icon: Brain,
                tone: 'violet' as const,
                title: 'Interactive activities',
                body: '37 sandboxed HTML modules (matrix mystics, vector playground, eigenspace explorer) with minimum dwell time enforced before unlocking.',
              },
              {
                icon: Library,
                tone: 'gold' as const,
                title: 'Conceptual MCQs',
                body: '1,060 curated questions, Fisher–Yates shuffled, with per-question feedback and a detailed explanation on every wrong answer.',
              },
              {
                icon: Shield,
                tone: 'sky' as const,
                title: 'Live proctor view',
                body: 'Admins see every active student in real-time via SSE. Strike events stream in alongside camera snapshots, no polling.',
              },
              {
                icon: Calendar,
                tone: 'rose' as const,
                title: 'Viva approval',
                body: 'Module done → unlock a viva slot. Instructor approves, ICS calendar invite sent, and the meeting URL is delivered via email.',
              },
              {
                icon: Trophy,
                tone: 'amber' as const,
                title: 'Granular score control',
                body: 'Admins can invalidate a single question, an item, a module, or a global reset. Per-student too — nothing is irreversible.',
              },
            ].map((f) => (
              <Card key={f.title} padding="md" interactive className="group">
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${
                    f.tone === 'emerald'
                      ? 'bg-emerald-100 text-emerald-700'
                      : f.tone === 'violet'
                        ? 'bg-violet-100 text-violet-700'
                        : f.tone === 'gold'
                          ? 'bg-amber-100 text-amber-700'
                          : f.tone === 'sky'
                            ? 'bg-sky-100 text-sky-700'
                            : f.tone === 'rose'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                  } transition-transform duration-300 group-hover:scale-110`}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-5">{f.title}</CardTitle>
                <CardDescription className="mt-2 leading-relaxed">{f.body}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== How it works ===================== */}
      <section id="how" className="border-t border-[var(--paper-line)]/50 bg-mesh py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <Badge tone="amber" className="mb-4">
              How a section works
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
              Watch, do, prove, advance.
            </h2>
            <p className="mt-4 text-lg text-[var(--ink-soft)]">
              Every section is a tight three-step loop. Nothing unlocks until the last step
              is verified.
            </p>
          </div>

          <ol className="stagger mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: '01',
                title: 'Watch',
                body: 'Stream the Mux video with the proctor active. You must be visible, present, and on the tab.',
                icon: Video,
              },
              {
                n: '02',
                title: 'Do',
                body: 'Complete the interactive activity in a sandboxed iframe. Minimum dwell time enforced.',
                icon: Brain,
              },
              {
                n: '03',
                title: 'Prove',
                body: 'Pass a conceptual quiz. Per-question feedback + explanations. Re-attempts allowed.',
                icon: CheckCircle2,
              },
              {
                n: '04',
                title: 'Advance',
                body: 'Unlock the next section — and book a viva with your instructor to earn a mark.',
                icon: Trophy,
              },
            ].map((step) => (
              <Card key={step.n} padding="md" className="relative">
                <div className="absolute -top-3 left-6 rounded-full bg-gradient-to-br from-emerald-600 to-violet-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                  {step.n}
                </div>
                <step.icon className="mt-2 h-6 w-6 text-[var(--primary)]" />
                <CardTitle className="mt-4">{step.title}</CardTitle>
                <CardDescription className="mt-2 leading-relaxed">{step.body}</CardDescription>
              </Card>
            ))}
          </ol>
        </div>
      </section>

      {/* ===================== Faculty testimonial ===================== */}
      <section
        id="testimonial"
        className="border-t border-[var(--paper-line)]/50 bg-white py-20 sm:py-28"
      >
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Quote className="mx-auto h-10 w-10 text-[var(--accent)]/70" />
          <blockquote className="mt-6 text-2xl font-medium leading-relaxed text-[var(--ink)] sm:text-3xl">
            “We needed a way to know students were actually{' '}
            <span className="text-gradient font-bold">thinking</span>, not just watching.
            Swadhyaya turned asynchronous study into something we can stand behind.”
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-violet-600 flex items-center justify-center text-white font-bold">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-[var(--ink)]">Faculty, IIT Ropar</div>
              <div className="text-sm text-[var(--ink-soft)]">Department of Mathematics</div>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { v: '99.2%', l: 'Quiz pass rate' },
              { v: '4.7×', l: 'Time-on-task vs. video alone' },
              { v: '252', l: 'Viva slots per cohort' },
              { v: '< 1s', l: 'Live tile refresh' },
            ].map((m) => (
              <div key={m.l} className="rounded-xl border border-[var(--paper-line)]/60 bg-[var(--paper)]/40 p-5">
                <div className="text-3xl font-bold text-[var(--ink)]">{m.v}</div>
                <div className="mt-1 text-xs text-[var(--ink-soft)]">{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="relative overflow-hidden border-t border-[var(--paper-line)]/50 bg-gradient-to-br from-[var(--primary)] via-[#195A4B] to-[var(--secondary)] py-20 text-white sm:py-24">
        <div className="absolute inset-0 bg-grid opacity-20" aria-hidden />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent)]/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[var(--secondary)]/30 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <Eye className="mx-auto h-8 w-8 text-[var(--accent)]" />
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to study earnestly?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Sign in with your institute account to pick up where you left off.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              href="/login"
              size="lg"
              className="!bg-white !text-[var(--primary)] hover:!bg-white/90"
            >
              Sign in to Swadhyaya
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-6 text-xs text-white/60">
            <BookOpen className="mr-1 inline h-3 w-3" /> Restricted to{' '}
            <span className="font-semibold text-white/80">@iitrpr.ac.in</span> accounts
            unless pre-approved.
          </p>
        </div>
      </section>

      {/* ===================== Footer ===================== */}
      <footer className="border-t border-[var(--paper-line)]/50 bg-[var(--paper)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo />
          <div className="text-sm text-[var(--ink-soft)]">
            © 2026 Swadhyaya · IIT Ropar Department of Mathematics
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--ink-soft)]">
            <Link href="/login" className="hover:text-[var(--ink)]">
              Sign in
            </Link>
            <span className="h-1 w-1 rounded-full bg-[var(--paper-line)]" />
            <span>v0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

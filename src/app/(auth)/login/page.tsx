'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  GraduationCap,
  Shield,
  Sparkles,
  User,
  AlertCircle,
  Lock,
  BookOpen,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type Account = {
  label: string;
  email: string;
  hint: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasSamagama = !!process.env.NEXT_PUBLIC_SAMAGAMA_ISSUER;
  const hasGoogle = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID === '1';
  const devQuickLogin = process.env.NEXT_PUBLIC_SWADHYAYA_DEV_AUTH === '1';

  async function handleEmailLogin(emailToUse: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        email: emailToUse,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  async function handleSamagamaLogin() {
    setLoading(true);
    setError(null);
    try {
      await signIn('samagama', { callbackUrl: '/dashboard' });
    } catch {
      setError('Failed to sign in with samagama.in');
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setError('Failed to sign in with Google');
      setLoading(false);
    }
  }

  const quickAccounts: Account[] = devQuickLogin
    ? [
        { label: 'Admin', email: 'admin@iitrpr.ac.in', hint: 'everything', role: 'ADMIN' },
        {
          label: 'Lead Instructor',
          email: 'sudarshan@iitrpr.ac.in',
          hint: 'admin + viva',
          role: 'INSTRUCTOR',
        },
        {
          label: 'Instructor (TA)',
          email: 'ta.swadhyaya@iitrpr.ac.in',
          hint: 'quiz + viva',
          role: 'INSTRUCTOR',
        },
        { label: 'Reviewer', email: 'reviewer@iitrpr.ac.in', hint: 'review only', role: 'INSTRUCTOR' },
        { label: 'Student', email: 'mudit@iitrpr.ac.in', hint: 'learn flow', role: 'STUDENT' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-paper-ruled">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ============ Left brand panel ============ */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[var(--primary)] via-[#195A4B] to-[var(--secondary)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-grid opacity-20" aria-hidden />
          <div className="absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-[var(--accent)]/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[var(--secondary)]/40 blur-3xl" aria-hidden />

          <div className="relative">
            <Logo variant="light" />
          </div>

          <div className="relative space-y-6">
            <Badge
              tone="gold"
              className="!bg-white/10 !text-white !ring-white/20 backdrop-blur"
              icon={<Sparkles className="h-3 w-3" />}
            >
              IIT Ropar · Spring 2026
            </Badge>
            <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
              Self-study,
              <br />
              <span className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                earnestly proctored.
              </span>
            </h1>
            <p className="max-w-md text-white/80">
              Pick up your last section, finish a quiz, or review a viva approval — your
              progress is exactly where you left it.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { v: '1,060', l: 'Questions' },
                { v: '6', l: 'Modules' },
                { v: '53', l: 'Sections' },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/10">
                  <div className="text-2xl font-bold">{s.v}</div>
                  <div className="text-xs text-white/70">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center gap-2 text-sm text-white/60">
            <Lock className="h-3.5 w-3.5" />
            Restricted to <span className="font-semibold text-white/80">@iitrpr.ac.in</span> ·
            ethics & consent enforced
          </div>
        </div>

        {/* ============ Right form panel ============ */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md animate-fade-up">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Logo />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-[var(--ink)]">Welcome back</h2>
              <p className="mt-1 text-[var(--ink-soft)]">Sign in to continue your learning journey.</p>
            </div>

            {devQuickLogin && (
              <div className="mt-6">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Dev quick sign-in
                  </span>
                  <span className="h-px flex-1 bg-[var(--paper-line)]/60" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleEmailLogin(acc.email)}
                      disabled={loading}
                      className="group relative overflow-hidden rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                            acc.role === 'ADMIN'
                              ? 'bg-rose-100 text-rose-700'
                              : acc.role === 'INSTRUCTOR'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {acc.role === 'ADMIN' ? (
                            <Shield className="h-3.5 w-3.5" />
                          ) : acc.role === 'INSTRUCTOR' ? (
                            <GraduationCap className="h-3.5 w-3.5" />
                          ) : (
                            <User className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-[var(--ink)]">{acc.label}</div>
                          <div className="truncate text-xs text-[var(--ink-soft)]">{acc.hint}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="my-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--paper-line)]/60" />
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--ink-soft)]">
                or sign in with
              </span>
              <span className="h-px flex-1 bg-[var(--paper-line)]/60" />
            </div>

            <div className="space-y-3">
              {hasSamagama && (
                <Button
                  onClick={handleSamagamaLogin}
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  <BookOpen className="h-4 w-4" />
                  Sign in with samagama.in
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              {hasGoogle && (
                <Button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  size="lg"
                  variant="secondary"
                  className="w-full"
                >
                  Sign in with Google
                </Button>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEmailLogin(email);
              }}
              className="mt-5 space-y-3"
            >
              <label className="block text-sm font-medium text-[var(--ink)]">
                Institute email
              </label>
              <input
                type="email"
                placeholder="admin@iitrpr.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                variant="primary"
                className="w-full"
              >
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <p className="mt-8 text-center text-sm text-[var(--ink-soft)]">
              <Link href="/" className="hover:text-[var(--ink)] hover:underline">
                ← Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

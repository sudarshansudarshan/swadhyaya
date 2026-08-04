'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { Search, LogOut, Menu, Bell, ChevronDown } from 'lucide-react';
import { Sidebar } from './sidebar';
import { Logo } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/Badge';

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  };
};

const roleTone: Record<Props['user']['role'], 'emerald' | 'violet' | 'amber'> = {
  STUDENT: 'emerald',
  INSTRUCTOR: 'violet',
  ADMIN: 'amber',
};

const roleLabel: Record<Props['user']['role'], string> = {
  STUDENT: 'Student',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Administrator',
};

export function Topbar({ user }: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [showResults, setShowResults] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    if (user.role !== 'ADMIN') return;
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {}
  }

  const initials = (user.name ?? user.email)
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--paper-line)]/50 bg-white/85 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          <button
            onClick={() => setNavOpen(true)}
            className="rounded-lg p-2 text-[var(--ink-soft)] transition-all hover:bg-emerald-50 hover:text-[var(--primary)] active:scale-95"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="lg:hidden">
            <Logo showWordmark={false} />
          </Link>
          <div className="hidden lg:block">
            <Logo />
          </div>

          {user.role === 'ADMIN' ? (
            <div className="ml-2 max-w-xl flex-1">
              <div className="group flex items-center gap-2 rounded-xl border border-[var(--paper-line)]/60 bg-[var(--paper)]/40 px-3 py-2 transition-all focus-within:border-emerald-300 focus-within:bg-white focus-within:shadow-sm">
                <Search className="h-4 w-4 text-[var(--ink-soft)]" />
                <input
                  type="text"
                  placeholder="Search students by name, email, or samagama sub..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)]"
                />
                <kbd className="hidden rounded border border-[var(--paper-line)] bg-white px-1.5 py-0.5 text-[10px] font-mono text-[var(--ink-soft)] sm:inline-block">
                  /
                </kbd>
              </div>
              {showResults && results.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-2 max-w-xl rounded-xl border border-[var(--paper-line)]/60 bg-white p-2 shadow-xl">
                  {results.map((r) => (
                    <Link
                      key={r.id}
                      href={`/admin/users/${r.id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-emerald-50/60"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-violet-600 text-xs font-bold text-white">
                        {(r.name ?? r.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[var(--ink)]">
                          {r.name ?? r.email}
                        </div>
                        <div className="truncate text-xs text-[var(--ink-soft)]">{r.email}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-2">
            <button
              className="relative hidden rounded-lg p-2 text-[var(--ink-soft)] transition-all hover:bg-emerald-50 hover:text-[var(--primary)] sm:block"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 200)}
                className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 transition-all hover:border-[var(--paper-line)]/60 hover:bg-[var(--paper)]/40"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-violet-600 text-xs font-bold text-white shadow-sm">
                  {initials || '?'}
                </div>
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-semibold text-[var(--ink)]">
                    {user.name ?? user.email.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-[var(--ink-soft)]">{user.email}</div>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[var(--ink-soft)] transition-transform ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right animate-fade-in rounded-xl border border-[var(--paper-line)]/60 bg-white p-2 shadow-xl">
                  <div className="px-3 py-2">
                    <div className="text-sm font-semibold text-[var(--ink)]">
                      {user.name ?? user.email}
                    </div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">{user.email}</div>
                    <Badge tone={roleTone[user.role]} className="mt-2">
                      {roleLabel[user.role]}
                    </Badge>
                  </div>
                  <div className="my-1 h-px bg-[var(--paper-line)]/60" />
                  <Link
                    href="/activities"
                    className="block rounded-lg px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--paper)]/60"
                    onClick={() => setMenuOpen(false)}
                  >
                    Activity gallery
                  </Link>
                  <Link
                    href="/profile"
                    className="block rounded-lg px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--paper)]/60"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile & settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Sidebar role={user.role} open={navOpen} onClose={() => setNavOpen(false)} />
    </>
  );
}

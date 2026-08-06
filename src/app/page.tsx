'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    try {
      const t = (localStorage.getItem('swadhyaya-theme') as Theme | null) ?? 'dark';
      if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      // Defer state sync to avoid cascading renders
      queueMicrotask(() => setTheme(t));
    } catch {}
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      if (next === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('swadhyaya-theme', next);
    } catch {}
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}

export function HomeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <ThemeToggle />
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <HomeShell>
      <div className="card">
        <h1>Swadhyaya</h1>
        <p className="subtitle">
          Self-study with proctored videos, interactive activities, and teacher-led viva approval.
        </p>

        <div className="menu-grid" style={{ marginTop: 12 }}>
          <Link href="/login" className="menu-card featured">
            <div className="menu-title">Sign in</div>
            <div className="menu-subtitle">via samagama.in</div>
          </Link>
          <Link href="/learn" className="menu-card">
            <div className="menu-title">Learn</div>
            <div className="menu-subtitle">53 sections</div>
          </Link>
          <Link href="/activities" className="menu-card">
            <div className="menu-title">Activities</div>
            <div className="menu-subtitle">37 interactive widgets</div>
          </Link>
          <Link href="/viva" className="menu-card">
            <div className="menu-title">Viva</div>
            <div className="menu-subtitle">book a slot</div>
          </Link>
        </div>

        <div className="button-row">
          <Link href="/login">
            <button>Start learning</button>
          </Link>
          <Link href="/dashboard">
            <button className="secondary">Go to dashboard</button>
          </Link>
        </div>
      </div>
    </HomeShell>
  );
}
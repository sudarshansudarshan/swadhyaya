'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  const quickAccounts = devQuickLogin
    ? [
        { label: 'Admin', email: 'admin@iitrpr.ac.in', hint: 'everything' },
        { label: 'Lead Instructor', email: 'sudarshan@iitrpr.ac.in', hint: 'admin + viva' },
        { label: 'Instructor (TA)', email: 'ta.swadhyaya@iitrpr.ac.in', hint: 'quiz + viva' },
        { label: 'Reviewer', email: 'reviewer@iitrpr.ac.in', hint: 'review only' },
        { label: 'Student', email: 'mudit@iitrpr.ac.in', hint: 'learn flow' },
      ]
    : [];

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 520 }}>
        <h1>Sign in</h1>
        <p className="subtitle">
          Welcome back. Choose how you&apos;d like to sign in.
        </p>

        {devQuickLogin && (
          <>
            <p className="custom-section-label">Dev quick sign-in</p>
            <div className="menu-grid" style={{ marginBottom: 24 }}>
              {quickAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className="menu-card"
                  onClick={() => handleEmailLogin(acc.email)}
                  disabled={loading}
                >
                  <div className="menu-title">{acc.label}</div>
                  <div className="menu-subtitle">{acc.hint}</div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="button-row" style={{ flexDirection: 'column', alignItems: 'stretch', marginTop: 8 }}>
          {hasSamagama && (
            <button onClick={handleSamagamaLogin} disabled={loading}>
              Sign in with samagama.in
            </button>
          )}
          {hasGoogle && (
            <button className="secondary" onClick={handleGoogleLogin} disabled={loading}>
              Sign in with Google
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEmailLogin(email);
          }}
          style={{ marginTop: 24 }}
        >
          <input
            type="email"
            className="answer-input"
            placeholder="admin@iitrpr.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ maxWidth: '100%' }}
          />
          <div className="button-row">
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in with email'}
            </button>
          </div>
        </form>

        {error && (
          <div className="feedback wrong" style={{ marginTop: 20 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <Link href="/" className="back-button" style={{ textDecoration: 'none' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
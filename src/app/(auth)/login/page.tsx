'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    } catch (err) {
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
    } catch (err) {
      setError('Failed to sign in with samagama.in');
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-violet-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center">Swadhyaya</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Sign in to continue learning
        </p>

        {devQuickLogin && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Dev quick sign-in
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleEmailLogin(acc.email)}
                  disabled={loading}
                  className="py-2 px-3 text-left border border-emerald-200 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition disabled:opacity-50"
                >
                  <span className="block text-sm font-medium text-emerald-800">{acc.label}</span>
                  <span className="block text-xs text-emerald-600">{acc.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {hasSamagama && (
            <button
              onClick={handleSamagamaLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              Sign in with samagama.in
            </button>
          )}
          {hasGoogle && (
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Sign in with Google
            </button>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">or</div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEmailLogin(email);
          }}
          className="mt-4 space-y-3"
        >
          <input
            type="email"
            placeholder="admin@iitrpr.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            Sign in
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

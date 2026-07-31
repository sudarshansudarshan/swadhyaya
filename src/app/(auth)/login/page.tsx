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

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        email,
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-violet-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center">Swadhyaya</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Sign in to continue learning
        </p>

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
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            Sign in with Google
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">or</div>

        <form onSubmit={handleEmailLogin} className="mt-4 space-y-3">
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
            Sign in (Admin only)
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

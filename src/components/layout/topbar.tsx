'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { Search, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  };
};

export function Topbar({ user }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
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

  return (
    <header className="border-b bg-white px-6 py-3 flex items-center gap-4">
      {user.role === 'ADMIN' ? (
        <div className="flex-1 max-w-xl relative">
          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-gray-50">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name, email, or samagama sub..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="bg-transparent outline-none flex-1 text-sm"
            />
          </div>
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-96 overflow-auto z-50">
              {results.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/users/${r.id}`}
                  className="block px-4 py-2 hover:bg-gray-50 border-b last:border-0"
                >
                  <div className="text-sm font-medium">{r.name ?? r.email}</div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium">{user.name ?? user.email}</div>
          <div className="text-xs text-muted-foreground">{user.role}</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-2 text-gray-500 hover:text-gray-700"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

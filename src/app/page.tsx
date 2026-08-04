import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-violet-50">
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Swadhyaya</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Self-study with proctored videos, interactive activities, and teacher-led viva approval.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
          >
            Sign in with samagama.in
          </Link>
        </div>
      </div>
    </div>
  );
}

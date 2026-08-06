import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 540, textAlign: 'center' }}>
        <h1>404</h1>
        <p className="subtitle">
          The page you&apos;re looking for doesn&apos;t exist — or has been moved.
        </p>
        <div className="button-row">
          <Link href="/">
            <button>Back to home</button>
          </Link>
          <Link href="/dashboard">
            <button className="secondary">Go to dashboard</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { Topbar } from '@/components/layout/topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Topbar user={user} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

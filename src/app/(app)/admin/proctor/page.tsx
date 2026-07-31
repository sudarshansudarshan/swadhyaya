import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { LiveProctorGrid } from '@/components/admin/LiveProctorGrid';

export default async function AdminProctorPage() {
  await requireAdmin();

  const recentSessions = await prisma.proctorSession.findMany({
    take: 30,
    orderBy: { startedAt: 'desc' },
    include: { user: { select: { name: true, email: true } }, item: { select: { title: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Proctor Dashboard</h1>
        <p className="text-muted-foreground">Live + recent proctor sessions</p>
      </div>

      <LiveProctorGrid />

      <div className="bg-white border rounded-xl">
        <h2 className="p-4 border-b font-semibold">Recent Sessions</h2>
        <div className="divide-y">
          {recentSessions.map((s) => (
            <div key={s.id} className="p-3 flex justify-between text-sm">
              <span>{s.user.name ?? s.user.email} · {s.item.title}</span>
              <span className="text-muted-foreground">
                penalty {s.penaltyScore} · {s.ejected ? 'EJECTED' : 'OK'} · {new Date(s.startedAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

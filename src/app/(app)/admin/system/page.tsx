import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { getActiveUserCount } from '@/lib/realtime';
import { Cpu, Database, Activity as ActivityIcon } from 'lucide-react';

export default async function SystemPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.isAdmin) redirect('/dashboard');

  const [users, sessions, items, attempts, vivas, kvActive] = await Promise.all([
    prisma.user.count(),
    prisma.proctorSession.count(),
    prisma.item.count(),
    prisma.quizAttempt.count(),
    prisma.vivaBooking.count(),
    getActiveUserCount().catch(() => 0),
  ]);

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recentUsers, recentAttempts, recentActivity] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: last24h } } }),
    prisma.quizAttempt.count({ where: { submittedAt: { gte: last24h } } }),
    prisma.activityLog.count({ where: { createdAt: { gte: last24h } } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Metrics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded-xl">
          <ActivityIcon className="h-5 w-5 text-emerald-600" />
          <div className="text-sm text-muted-foreground mt-2">Live users (KV)</div>
          <div className="text-2xl font-bold">{kvActive}</div>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <Database className="h-5 w-5 text-blue-600" />
          <div className="text-sm text-muted-foreground mt-2">Total users</div>
          <div className="text-2xl font-bold">{users}</div>
          <div className="text-xs text-muted-foreground">+{recentUsers} today</div>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <Cpu className="h-5 w-5 text-violet-600" />
          <div className="text-sm text-muted-foreground mt-2">Items in catalog</div>
          <div className="text-2xl font-bold">{items}</div>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <Database className="h-5 w-5 text-amber-600" />
          <div className="text-sm text-muted-foreground mt-2">Quiz attempts (24h)</div>
          <div className="text-2xl font-bold">{recentAttempts}</div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Storage</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Proctor sessions (total)</div>
            <div className="text-xl font-bold">{sessions}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Quiz attempts (total)</div>
            <div className="text-xl font-bold">{attempts}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Viva bookings (total)</div>
            <div className="text-xl font-bold">{vivas}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Activity events (24h)</div>
            <div className="text-xl font-bold">{recentActivity}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">External services</h2>
        <ul className="text-sm space-y-1">
          <li>MongoDB Atlas: see <a className="text-emerald-600 underline" href="https://cloud.mongodb.com">cloud.mongodb.com</a></li>
          <li>Vercel KV: see Vercel dashboard → Storage</li>
          <li>Mux: see <a className="text-emerald-600 underline" href="https://dashboard.mux.com">dashboard.mux.com</a></li>
          <li>Cloudinary: see <a className="text-emerald-600 underline" href="https://cloudinary.com/console">cloudinary.com/console</a></li>
          <li>Resend: see <a className="text-emerald-600 underline" href="https://resend.com/dashboard">resend.com/dashboard</a></li>
        </ul>
      </div>
    </div>
  );
}

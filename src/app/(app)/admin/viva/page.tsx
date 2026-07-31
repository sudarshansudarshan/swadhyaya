import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, Users } from 'lucide-react';

export default async function AdminVivaPage() {
  await requireAdmin();

  const [bookings, slots, instructors] = await Promise.all([
    prisma.vivaBooking.findMany({
      take: 50,
      orderBy: { bookedAt: 'desc' },
      include: { user: { select: { name: true, email: true } }, module: true, slot: { include: { instructor: true } } },
    }),
    prisma.vivaSlot.count(),
    prisma.instructor.findMany({ select: { id: true, name: true, email: true, active: true } }),
  ]);

  const byStatus = {
    PENDING: bookings.filter((b) => b.status === 'PENDING').length,
    CONFIRMED: bookings.filter((b) => b.status === 'CONFIRMED').length,
    CANCELLED: bookings.filter((b) => b.status === 'CANCELLED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Viva Management</h1>
        <p className="text-muted-foreground">{slots} slots · {instructors.length} instructors · {bookings.length} bookings</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold text-amber-600">{byStatus.PENDING}</div>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm text-muted-foreground">Confirmed</div>
          <div className="text-2xl font-bold text-emerald-600">{byStatus.CONFIRMED}</div>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm text-muted-foreground">Cancelled</div>
          <div className="text-2xl font-bold text-red-600">{byStatus.CANCELLED}</div>
        </div>
      </div>

      <div className="bg-white border rounded-xl">
        <h2 className="p-4 border-b font-semibold">Recent Bookings</h2>
        <div className="divide-y">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/teacher/viva/${b.id}`}
              className="block p-3 flex justify-between text-sm hover:bg-gray-50"
            >
              <span>{b.user.name ?? b.user.email} · Module {b.module.number}</span>
              <span>
                {b.slot.startUtc ? new Date(b.slot.startUtc).toLocaleString() : '—'} · {b.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Calendar } from 'lucide-react';

export default async function TeacherVivaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.isInstructor && !user.isAdmin) redirect('/dashboard');

  const instructor = await prisma.instructor.findUnique({
    where: { userId: user.id },
  });

  const pendingBookings = instructor
    ? await prisma.vivaBooking.findMany({
        where: { status: 'PENDING', slot: { instructorId: instructor.id } },
        include: { user: true, module: true, slot: true },
        orderBy: { bookedAt: 'asc' },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Viva Approvals</h1>
        <p className="text-muted-foreground">{pendingBookings.length} booking(s) waiting</p>
      </div>

      {pendingBookings.length === 0 ? (
        <div className="p-8 bg-white border rounded-xl text-center text-muted-foreground">
          🎉 No pending bookings. Great work!
        </div>
      ) : (
        <div className="space-y-3">
          {pendingBookings.map((b) => (
            <Link
              key={b.id}
              href={`/teacher/viva/${b.id}`}
              className="block p-4 bg-white border rounded-xl hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{b.user.name ?? b.user.email}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Module {b.module.number} · {new Date(b.slot.startUtc).toLocaleString()}
                  </div>
                </div>
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

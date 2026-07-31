import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import Link from 'next/link';
import { GraduationCap, Calendar, Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function TeacherIndex() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.isInstructor && !user.isAdmin) redirect('/dashboard');

  const pendingCount = await prisma.vivaBooking.count({ where: { status: 'PENDING' } });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Teacher Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/teacher/viva" className="p-6 bg-white border rounded-xl hover:shadow-md">
          <Calendar className="h-6 w-6 text-amber-600" />
          <div className="mt-2 text-lg font-semibold">Viva Approvals</div>
          <div className="text-sm text-muted-foreground">{pendingCount} pending</div>
        </Link>
        <div className="p-6 bg-white border rounded-xl">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <div className="mt-2 text-lg font-semibold">My Modules</div>
          <div className="text-sm text-muted-foreground">View assigned modules and student progress</div>
        </div>
      </div>
    </div>
  );
}

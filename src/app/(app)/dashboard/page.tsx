import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import Link from 'next/link';
import { BookOpen, Calendar, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === 'STUDENT') {
    return <StudentDashboard userId={user.id} />;
  }
  if (user.role === 'INSTRUCTOR') {
    return <InstructorDashboard userId={user.id} />;
  }
  return <AdminDashboard />;
}

async function StudentDashboard({ userId }: { userId: string }) {
  const [enrollments, moduleProgress, vivaBookings] = await Promise.all([
    prisma.courseEnrollment.findMany({ where: { userId }, include: { course: { include: { modules: true } } } }),
    prisma.moduleProgress.findMany({ where: { userId } }),
    prisma.vivaBooking.findMany({ where: { userId, status: { in: ['PENDING', 'CONFIRMED'] } }, include: { slot: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-1">Continue your learning journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/learn" className="block p-4 bg-white border rounded-xl hover:shadow-md transition">
          <BookOpen className="h-5 w-5 text-emerald-600" />
          <div className="mt-2 text-sm font-medium">Continue Learning</div>
          <div className="text-xs text-muted-foreground">{enrollments.length} course(s) enrolled</div>
        </Link>
        <Link href="/viva" className="block p-4 bg-white border rounded-xl hover:shadow-md transition">
          <Calendar className="h-5 w-5 text-violet-600" />
          <div className="mt-2 text-sm font-medium">Your Viva</div>
          <div className="text-xs text-muted-foreground">{vivaBookings.length} active booking(s)</div>
        </Link>
        <div className="block p-4 bg-white border rounded-xl">
          <TrendingUp className="h-5 w-5 text-amber-600" />
          <div className="mt-2 text-sm font-medium">Modules Completed</div>
          <div className="text-xs text-muted-foreground">{moduleProgress.filter((m) => m.allItemsDone).length} done</div>
        </div>
      </div>

      {enrollments.length === 0 && (
        <div className="p-8 bg-white border rounded-xl text-center">
          <p className="text-muted-foreground">No courses yet. Browse the catalogue to start.</p>
        </div>
      )}
    </div>
  );
}

async function InstructorDashboard({ userId }: { userId: string }) {
  const instructor = await prisma.instructor.findUnique({ where: { userId } });
  if (!instructor) return <div>Not registered as instructor.</div>;

  const pendingVivas = await prisma.vivaBooking.findMany({
    where: {
      status: 'PENDING',
      slot: { instructorId: instructor.id },
    },
    include: { user: true, slot: true, module: true },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
        <p className="text-muted-foreground mt-1">{instructor.name} · {instructor.staffRole.replace(/_/g, ' ')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm font-medium text-muted-foreground">Pending Vivas</div>
          <div className="mt-2 text-2xl font-bold">{pendingVivas.length}</div>
        </div>
      </div>

      {pendingVivas.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Pending Approvals</h2>
          <div className="space-y-2">
            {pendingVivas.map((v) => (
              <Link
                key={v.id}
                href={`/teacher/viva/${v.id}`}
                className="block p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">{v.user.name ?? v.user.email}</div>
                <div className="text-sm text-muted-foreground">
                  Module {v.module.number} · {v.slot.startUtc.toLocaleString()}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

async function AdminDashboard() {
  const [userCount, courseCount, itemCount, pendingVivas, recentActivity] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.item.count(),
    prisma.vivaBooking.count({ where: { status: 'PENDING' } }),
    prisma.activityLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Swadhyaya overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm text-muted-foreground">Users</div>
          <div className="text-2xl font-bold">{userCount}</div>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm text-muted-foreground">Courses</div>
          <div className="text-2xl font-bold">{courseCount}</div>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm text-muted-foreground">Items</div>
          <div className="text-2xl font-bold">{itemCount}</div>
        </div>
        <Link href="/admin/viva" className="p-4 bg-white border rounded-xl hover:shadow-md">
          <div className="text-sm text-muted-foreground">Pending Vivas</div>
          <div className="text-2xl font-bold text-amber-600">{pendingVivas}</div>
        </Link>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-2 text-sm">
          {recentActivity.map((a) => (
            <div key={a.id} className="flex justify-between py-1">
              <span>{a.type}</span>
              <span className="text-muted-foreground">{a.createdAt.toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

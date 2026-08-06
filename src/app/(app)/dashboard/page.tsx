import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === 'STUDENT') {
    return <StudentDashboard userId={user.id} userName={user.name} />;
  }
  if (user.role === 'INSTRUCTOR') {
    return <InstructorDashboard userId={user.id} userName={user.name} />;
  }
  return <AdminDashboard />;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'A quiet night to study';
}

function firstName(name: string | null | undefined, email: string) {
  if (name) return name.split(' ')[0];
  return email.split('@')[0];
}

async function StudentDashboard({ userId, userName }: { userId: string; userName: string | null }) {
  const [enrollments, moduleProgress, vivaBookings] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { userId },
      include: { course: { include: { modules: { orderBy: { number: 'asc' } } } } },
    }),
    prisma.moduleProgress.findMany({ where: { userId } }),
    prisma.vivaBooking.findMany({
      where: { userId, status: { in: ['PENDING', 'CONFIRMED'] } },
      include: { slot: true, module: true },
      orderBy: { bookedAt: 'desc' },
      take: 3,
    }),
  ]);

  const completedModules = moduleProgress.filter((m) => m.allItemsDone).length;
  const totalModules = enrollments.reduce((s, e) => s + e.course.modules.length, 0);
  const progressPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const first = firstName(userName, '');

  return (
    <div className="space-y-8">
      <div className="welcome-box" style={{ paddingTop: 0, paddingBottom: 0, textAlign: 'left' }}>
        <p className="custom-section-label">{greeting()}</p>
        <h1 style={{ textAlign: 'left' }}>Welcome back, {first}.</h1>
        <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>
          {completedModules === 0
            ? 'Pick a course below to begin your self-study.'
            : `You're ${progressPct}% through your enrolled courses. Keep going.`}
        </p>
      </div>

      <div className="menu-grid">
        <Link href="/learn" className="menu-card featured">
          <div className="menu-title">Continue</div>
          <div className="menu-subtitle">{enrollments.length} enrolled</div>
        </Link>
        <Link href="/viva" className="menu-card">
          <div className="menu-title">Viva</div>
          <div className="menu-subtitle">{vivaBookings.length} active</div>
        </Link>
        <Link href="/activities" className="menu-card">
          <div className="menu-title">Activities</div>
          <div className="menu-subtitle">37 widgets</div>
        </Link>
        <Link href="/profile" className="menu-card">
          <div className="menu-title">Profile</div>
          <div className="menu-subtitle">{progressPct}% progress</div>
        </Link>
      </div>

      {vivaBookings.length > 0 && (
        <div className="is-log">
          <h3>Upcoming vivas</h3>
          <div className="is-log-entries">
            {vivaBookings.map((v) => (
              <Link
                key={v.id}
                href="/viva"
                className="is-log-entry"
                style={{ textDecoration: 'none' }}
              >
                <span className="is-log-step">M{v.module.number}</span>
                <span>{v.module.title}</span>
                <span className="is-log-verdict" style={{ color: v.status === 'CONFIRMED' ? 'var(--clr-correct)' : 'var(--clr-accent)' }}>
                  {v.status} · {v.slot.startUtc.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

async function InstructorDashboard({ userId, userName }: { userId: string; userName: string | null }) {
  const instructor = await prisma.instructor.findUnique({ where: { userId } });
  if (!instructor) {
    return (
      <div className="space-y-6">
        <h1>Not registered as instructor</h1>
      </div>
    );
  }

  const [pendingVivas, confirmedVivas, allVivas] = await Promise.all([
    prisma.vivaBooking.findMany({
      where: { status: 'PENDING', slot: { instructorId: instructor.id } },
      include: { user: true, slot: true, module: true },
      orderBy: { bookedAt: 'desc' },
      take: 10,
    }),
    prisma.vivaBooking.count({
      where: { status: 'CONFIRMED', slot: { instructorId: instructor.id } },
    }),
    prisma.vivaBooking.count({ where: { slot: { instructorId: instructor.id } } }),
  ]);

  const first = firstName(userName, instructor.name);

  return (
    <div className="space-y-8">
      <div className="welcome-box" style={{ paddingTop: 0, paddingBottom: 0, textAlign: 'left' }}>
        <p className="custom-section-label">{greeting()}</p>
        <h1 style={{ textAlign: 'left' }}>Welcome, {first}.</h1>
        <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>
          {instructor.name} · {instructor.staffRole.replace(/_/g, ' ')}
        </p>
      </div>

      <div className="menu-grid">
        <Link href="/teacher" className="menu-card featured">
          <div className="menu-title">Pending</div>
          <div className="menu-subtitle">{pendingVivas.length} approvals</div>
        </Link>
        <div className="menu-card">
          <div className="menu-title">Confirmed</div>
          <div className="menu-subtitle">{confirmedVivas} upcoming</div>
        </div>
        <div className="menu-card">
          <div className="menu-title">All-time</div>
          <div className="menu-subtitle">{allVivas} vivas</div>
        </div>
        <div className="menu-card">
          <div className="menu-title">Permissions</div>
          <div className="menu-subtitle">
            {Object.values((instructor.permissions as Record<string, boolean>) ?? {}).filter(Boolean).length} active
          </div>
        </div>
      </div>

      <div className="is-log">
        <h3>Pending approvals</h3>
        {pendingVivas.length === 0 ? (
          <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>
            All caught up. No pending requests.
          </p>
        ) : (
          <div className="is-log-entries">
            {pendingVivas.map((v) => (
              <Link
                key={v.id}
                href={`/teacher/viva/${v.id}`}
                className="is-log-entry"
                style={{ textDecoration: 'none' }}
              >
                <span className="is-log-step">M{v.module.number}</span>
                <span>{v.user.name ?? v.user.email}</span>
                <span className="is-log-verdict is-pending">PENDING</span>
                <span className="is-log-verdict" style={{ color: 'var(--clr-text-soft)' }}>
                  {v.slot.startUtc.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function AdminDashboard() {
  const fiveMinAgo = new Date();
  fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);
  const [userCount, courseCount, itemCount, pendingVivas, recentActivity, instructorCount, liveSessions] =
    await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.item.count(),
      prisma.vivaBooking.count({ where: { status: 'PENDING' } }),
      prisma.activityLog.findMany({ take: 8, orderBy: { createdAt: 'desc' } }),
      prisma.instructor.count({ where: { active: true } }),
      prisma.liveSession.count({ where: { lastHeartbeat: { gte: fiveMinAgo } } }),
    ]);

  return (
    <div className="space-y-8">
      <div className="welcome-box" style={{ paddingTop: 0, paddingBottom: 0, textAlign: 'left' }}>
        <p className="custom-section-label">System overview</p>
        <h1 style={{ textAlign: 'left' }}>Control center</h1>
        <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>
          Live metrics, pending approvals, and a real-time activity feed.
        </p>
      </div>

      <div className="menu-grid">
        <div className="menu-card featured">
          <div className="menu-title">Users</div>
          <div className="menu-subtitle">{userCount} registered</div>
        </div>
        <div className="menu-card">
          <div className="menu-title">Instructors</div>
          <div className="menu-subtitle">{instructorCount} active</div>
        </div>
        <div className="menu-card">
          <div className="menu-title">Courses</div>
          <div className="menu-subtitle">{courseCount} · {itemCount} items</div>
        </div>
        <Link href="/admin/viva" className="menu-card">
          <div className="menu-title">Pending vivas</div>
          <div className="menu-subtitle">{pendingVivas} need approval</div>
        </Link>
      </div>

      <div className="menu-grid" style={{ marginTop: 0 }}>
        <Link href="/admin/live" className="menu-card placeholder">
          <div className="menu-title">Live</div>
          <div className="menu-subtitle">{liveSessions} sessions</div>
        </Link>
        <Link href="/admin/users" className="menu-card placeholder">
          <div className="menu-title">Users</div>
          <div className="menu-subtitle">search &amp; edit</div>
        </Link>
        <Link href="/admin/courses" className="menu-card placeholder">
          <div className="menu-title">Courses</div>
          <div className="menu-subtitle">CRUD</div>
        </Link>
        <Link href="/admin/proctor" className="menu-card placeholder">
          <div className="menu-title">Proctor</div>
          <div className="menu-subtitle">anomalies</div>
        </Link>
        <Link href="/admin/activity" className="menu-card placeholder">
          <div className="menu-title">Activity</div>
          <div className="menu-subtitle">event log</div>
        </Link>
        <Link href="/admin/system" className="menu-card placeholder">
          <div className="menu-title">System</div>
          <div className="menu-subtitle">metrics</div>
        </Link>
        <Link href="/admin/items/quiz" className="menu-card placeholder">
          <div className="menu-title">Question bank</div>
          <div className="menu-subtitle">MCQ editor</div>
        </Link>
        <Link href="/admin/instructors" className="menu-card placeholder">
          <div className="menu-title">Instructors</div>
          <div className="menu-subtitle">RBAC</div>
        </Link>
        <Link href="/activities" className="menu-card placeholder">
          <div className="menu-title">Activities</div>
          <div className="menu-subtitle">gallery</div>
        </Link>
      </div>

      <div className="is-log">
        <h3>Recent activity</h3>
        {recentActivity.length === 0 ? (
          <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>No activity yet.</p>
        ) : (
          <div className="is-log-entries">
            {recentActivity.map((a) => (
              <div key={a.id} className="is-log-entry">
                <span className="is-log-step">{a.type}</span>
                <span className="is-log-verdict" style={{ color: 'var(--clr-text-soft)' }}>
                  {a.createdAt.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
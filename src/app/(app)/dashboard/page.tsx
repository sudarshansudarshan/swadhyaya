import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  TrendingUp,
  GraduationCap,
  Clock,
  Sparkles,
  ArrowRight,
  Users,
  Library,
  Shield,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'A quiet night to study';
}

function getFirstName(name: string | null | undefined, email: string) {
  if (name) return name.split(' ')[0];
  return email.split('@')[0];
}

async function StudentDashboard({ userId, userName }: { userId: string; userName: string | null }) {
  const [enrollments, moduleProgress, vivaBookings, recentProgress] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: { orderBy: { number: 'asc' } },
          },
        },
      },
    }),
    prisma.moduleProgress.findMany({ where: { userId } }),
    prisma.vivaBooking.findMany({
      where: { userId, status: { in: ['PENDING', 'CONFIRMED'] } },
      include: { slot: true, module: true },
      orderBy: { bookedAt: 'desc' },
      take: 3,
    }),
    prisma.topicProgress.findMany({
      where: { userId, OR: [{ videoCompleted: true }, { activityCompleted: true }, { quizCompleted: true }] },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { item: true },
    }),
  ]);

  const completedModules = moduleProgress.filter((m) => m.allItemsDone).length;
  const totalModules = enrollments.reduce((sum, e) => sum + e.course.modules.length, 0);
  const progressPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const firstName = getFirstName(userName, '');

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <p className="text-sm font-medium text-[var(--primary)]">{getGreeting()} 👋</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
          Welcome back, <span className="text-gradient">{firstName}</span>
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          {completedModules === 0
            ? 'Pick a course below to begin your self-study.'
            : `You're ${progressPct}% through your enrolled courses. Keep going.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger">
        <StatCard
          label="Modules done"
          value={completedModules}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
          hint={`of ${totalModules} total`}
        />
        <StatCard
          label="Enrolled"
          value={enrollments.length}
          icon={<Library className="h-5 w-5" />}
          tone="violet"
          hint="courses"
        />
        <StatCard
          label="Vivas"
          value={vivaBookings.length}
          icon={<Calendar className="h-5 w-5" />}
          tone="amber"
          hint="active"
        />
        <StatCard
          label="Progress"
          value={`${progressPct}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="sky"
          hint="course-wide"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--ink)]">Continue learning</h2>
            <Link
              href="/learn"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2">
            {enrollments.slice(0, 4).map((enrollment) => {
              const c = enrollment.course;
              const cProgress = moduleProgress.filter(
                (m) => m.allItemsDone && c.modules.some((cm) => cm.id === m.moduleId),
              ).length;
              const pct = c.modules.length > 0 ? Math.round((cProgress / c.modules.length) * 100) : 0;
              return (
                <Link
                  key={enrollment.id}
                  href={`/learn/${c.id}`}
                  className="group block"
                >
                  <Card padding="md" interactive className="h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge tone="emerald" className="mb-2">
                          {c.modules.length} modules
                        </Badge>
                        <CardTitle className="line-clamp-2">{c.title}</CardTitle>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition-transform group-hover:scale-110">
                        <BookOpen className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-[var(--ink-soft)]">
                        <span>Progress</span>
                        <span className="font-semibold text-[var(--ink)]">{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-emerald-50">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
            {enrollments.length === 0 && (
              <Card padding="lg" className="sm:col-span-2 text-center">
                <Library className="mx-auto h-10 w-10 text-[var(--ink-soft)]" />
                <CardTitle className="mt-3">No courses yet</CardTitle>
                <CardDescription className="mt-1">
                  Browse the catalogue to start your self-study.
                </CardDescription>
                <Link
                  href="/learn"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  Explore courses <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--ink)]">Upcoming vivas</h2>
            <Link
              href="/viva"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {vivaBookings.length === 0 ? (
              <Card padding="md" className="text-center">
                <Calendar className="mx-auto h-8 w-8 text-[var(--ink-soft)]" />
                <CardDescription className="mt-2">
                  Complete a module to unlock viva booking.
                </CardDescription>
              </Card>
            ) : (
              vivaBookings.map((v) => (
                <Link key={v.id} href={`/viva`}>
                  <Card padding="sm" interactive>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[var(--ink)]">
                          {v.module.title}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[var(--ink-soft)]">
                          <Clock className="h-3 w-3" />
                          {v.slot.startUtc.toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <Badge tone={v.status === 'CONFIRMED' ? 'emerald' : 'amber'}>
                        {v.status}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>

          {recentProgress.length > 0 && (
            <>
              <h2 className="pt-2 text-xl font-bold text-[var(--ink)]">Recent activity</h2>
              <Card padding="md">
                <ul className="space-y-3">
                  {recentProgress.slice(0, 4).map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[var(--ink)]">{p.item?.title ?? 'Item completed'}</div>
                        <div className="text-xs text-[var(--ink-soft)]">
                          {p.completedAt?.toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) ?? p.updatedAt.toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

async function InstructorDashboard({ userId, userName }: { userId: string; userName: string | null }) {
  const instructor = await prisma.instructor.findUnique({ where: { userId } });
  if (!instructor) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[var(--ink)]">Not registered as instructor</h1>
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

  const firstName = getFirstName(userName, instructor.name);

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <p className="text-sm font-medium text-[var(--primary)]">{getGreeting()} 👋</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
          Welcome, <span className="text-gradient">{firstName}</span>
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          {instructor.name} · <span className="font-medium text-[var(--ink)]">{instructor.staffRole.replace(/_/g, ' ')}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger">
        <StatCard
          label="Pending vivas"
          value={pendingVivas.length}
          icon={<Calendar className="h-5 w-5" />}
          tone="amber"
          hint="awaiting your approval"
        />
        <StatCard
          label="Confirmed"
          value={confirmedVivas}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
          hint="upcoming"
        />
        <StatCard
          label="All-time"
          value={allVivas}
          icon={<GraduationCap className="h-5 w-5" />}
          tone="violet"
          hint="vivas"
        />
        <StatCard
          label="Permissions"
          value={Object.values((instructor.permissions as Record<string, boolean>) ?? {}).filter(Boolean).length}
          icon={<Shield className="h-5 w-5" />}
          tone="sky"
          hint="active"
        />
      </div>

      <Card padding="md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <CardTitle>Pending approvals</CardTitle>
            <CardDescription>
              Review and approve student viva requests assigned to you.
            </CardDescription>
          </div>
          <Badge tone="amber">{pendingVivas.length} pending</Badge>
        </div>
        {pendingVivas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--paper-line)] py-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-[var(--accent)]" />
            <p className="mt-2 text-sm text-[var(--ink-soft)]">All caught up. No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingVivas.map((v) => (
              <Link
                key={v.id}
                href={`/teacher/viva/${v.id}`}
                className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-amber-200 hover:bg-amber-50/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-violet-600 text-sm font-bold text-white">
                  {(v.user.name ?? v.user.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[var(--ink)]">
                    {v.user.name ?? v.user.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                    <span className="font-medium text-[var(--ink)]">Module {v.module.number}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {v.slot.startUtc.toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--ink-soft)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--primary)]" />
              </Link>
            ))}
          </div>
        )}
      </Card>
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
      <div className="animate-fade-up">
        <p className="text-sm font-medium text-[var(--primary)]">System overview</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
          Swadhyaya <span className="text-gradient">control center</span>
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Live metrics, pending approvals, and a real-time activity feed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger">
        <StatCard
          label="Users"
          value={userCount}
          icon={<Users className="h-5 w-5" />}
          tone="emerald"
          hint="registered"
        />
        <StatCard
          label="Instructors"
          value={instructorCount}
          icon={<GraduationCap className="h-5 w-5" />}
          tone="violet"
          hint="active"
        />
        <StatCard
          label="Courses"
          value={courseCount}
          icon={<Library className="h-5 w-5" />}
          tone="sky"
          hint={`${itemCount} items`}
        />
        <Link href="/admin/viva" className="group block">
          <Card padding="md" interactive className="h-full">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--ink-soft)]">
                  Pending vivas
                </div>
                <div className="mt-2 text-3xl font-bold text-amber-600">{pendingVivas}</div>
                <div className="mt-1 text-xs text-[var(--ink-soft)]">need approval</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition-transform group-hover:scale-110">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--ink)]">Quick actions</h2>
          </div>
          <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { href: '/admin/live', label: 'Live', icon: Activity, tone: 'emerald' as const },
              { href: '/admin/users', label: 'Users', icon: Users, tone: 'violet' as const },
              { href: '/admin/courses', label: 'Courses', icon: BookOpen, tone: 'sky' as const },
              { href: '/admin/proctor', label: 'Proctor', icon: Shield, tone: 'rose' as const },
              { href: '/admin/activity', label: 'Activity', icon: TrendingUp, tone: 'amber' as const },
              { href: '/admin/system', label: 'System', icon: Sparkles, tone: 'gold' as const },
              { href: '/admin/items/quiz', label: 'Question bank', icon: BookOpen, tone: 'emerald' as const },
              { href: '/admin/instructors', label: 'Instructors', icon: GraduationCap, tone: 'violet' as const },
              { href: '/activities', label: 'Activity gallery', icon: Sparkles, tone: 'gold' as const },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="group block">
                <Card padding="md" interactive className="h-full">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      a.tone === 'emerald'
                        ? 'bg-emerald-100 text-emerald-700'
                        : a.tone === 'violet'
                          ? 'bg-violet-100 text-violet-700'
                          : a.tone === 'sky'
                            ? 'bg-sky-100 text-sky-700'
                            : a.tone === 'rose'
                              ? 'bg-rose-100 text-rose-700'
                              : a.tone === 'amber'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-amber-100 text-amber-700'
                    } transition-transform group-hover:scale-110`}
                  >
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-[var(--ink)]">{a.label}</div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--ink)]">Live now</h2>
            <Link
              href="/admin/live"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Open <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <span className="absolute inset-0 animate-pulse-soft rounded-full bg-emerald-200" />
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--ink)]">{liveSessions}</div>
                <div className="text-xs text-[var(--ink-soft)]">active sessions</div>
              </div>
            </div>
          </Card>

          <h2 className="pt-2 text-xl font-bold text-[var(--ink)]">Recent activity</h2>
          <Card padding="md">
            {recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--ink-soft)]">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--paper)]">
                      <Activity className="h-3 w-3 text-[var(--ink-soft)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-[var(--ink)]">{a.type}</div>
                      <div className="text-xs text-[var(--ink-soft)]">
                        {a.createdAt.toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

type Tone = 'emerald' | 'violet' | 'amber' | 'sky' | 'rose' | 'slate' | 'gold';

const toneClasses: Record<Tone, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-700' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-700' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-700' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700' },
  gold: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

function StatCard({
  label,
  value,
  icon,
  tone,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: Tone;
  hint?: string;
}) {
  return (
    <Card padding="md" className="h-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--ink-soft)]">
            {label}
          </div>
          <div className="mt-2 text-3xl font-bold text-[var(--ink)]">{value}</div>
          {hint && <div className="mt-1 text-xs text-[var(--ink-soft)]">{hint}</div>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone].bg} ${toneClasses[tone].text}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

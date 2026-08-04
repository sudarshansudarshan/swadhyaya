'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  BookOpen,
  Calendar,
  GraduationCap,
  Home,
  LayoutDashboard,
  Library,
  Settings,
  Shield,
  Sparkles,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
  section: 'main' | 'teach' | 'admin';
};

const items: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" />, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'], section: 'main' },
  { href: '/learn', label: 'Learn', icon: <BookOpen className="h-4 w-4" />, roles: ['STUDENT'], section: 'main' },
  { href: '/activities', label: 'Activity Gallery', icon: <Sparkles className="h-4 w-4" />, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'], section: 'main' },
  { href: '/viva', label: 'My Viva', icon: <Calendar className="h-4 w-4" />, roles: ['STUDENT'], section: 'main' },

  { href: '/teacher', label: 'Teacher Hub', icon: <GraduationCap className="h-4 w-4" />, roles: ['INSTRUCTOR', 'ADMIN'], section: 'teach' },
  { href: '/viva', label: 'Viva Approvals', icon: <Calendar className="h-4 w-4" />, roles: ['INSTRUCTOR'], section: 'teach' },

  { href: '/admin', label: 'Admin Home', icon: <LayoutDashboard className="h-4 w-4" />, roles: ['ADMIN'], section: 'admin' },
  { href: '/admin/live', label: 'Live Presence', icon: <Activity className="h-4 w-4" />, roles: ['ADMIN'], section: 'admin' },
  { href: '/admin/activity', label: 'Activity Feed', icon: <BarChart3 className="h-4 w-4" />, roles: ['ADMIN'], section: 'admin' },
  { href: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" />, roles: ['ADMIN'], section: 'admin' },
  { href: '/admin/courses', label: 'Courses', icon: <Library className="h-4 w-4" />, roles: ['ADMIN'], section: 'admin' },
  { href: '/admin/proctor', label: 'Proctor', icon: <Shield className="h-4 w-4" />, roles: ['ADMIN'], section: 'admin' },
  { href: '/admin/viva', label: 'Viva Bookings', icon: <Calendar className="h-4 w-4" />, roles: ['ADMIN'], section: 'admin' },
  { href: '/admin/instructors', label: 'Instructors', icon: <UserCog className="h-4 w-4" />, roles: ['ADMIN'], section: 'admin' },
  { href: '/admin/system', label: 'System', icon: <Settings className="h-4 w-4" />, roles: ['ADMIN'], section: 'admin' },

  { href: '/profile', label: 'Profile', icon: <Settings className="h-4 w-4" />, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'], section: 'main' },
];

const sectionLabels: Record<NavItem['section'], string> = {
  main: 'Workspace',
  teach: 'Teaching',
  admin: 'Administration',
};

type Props = {
  role: Role | string;
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ role, open, onClose }: Props) {
  const pathname = usePathname();
  const visible = items.filter((i) => i.roles.includes(role as Role));

  const sections: NavItem['section'][] = ['main', 'teach', 'admin'];
  const grouped = sections
    .map((s) => ({ section: s, items: visible.filter((i) => i.section === s) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-[var(--paper-line)]/60 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--paper-line)]/60 p-4">
          <Logo />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            title="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-4">
          {grouped.map((group) => (
            <div key={group.section}>
              <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                {sectionLabels[group.section]}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                        active
                          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/40 font-semibold text-[var(--primary)]'
                          : 'text-[var(--ink-soft)] hover:bg-[var(--paper)]/60 hover:text-[var(--ink)]'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--primary)]" />
                      )}
                      <span
                        className={`transition-colors ${
                          active ? 'text-[var(--primary)]' : 'text-[var(--ink-soft)] group-hover:text-[var(--ink)]'
                        }`}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--paper-line)]/60 p-4">
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-violet-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--primary)]">
              <Shield className="h-3.5 w-3.5" />
              Ethics first
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--ink-soft)]">
              All sessions are proctored. Tabs, voice, and motion are monitored locally.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

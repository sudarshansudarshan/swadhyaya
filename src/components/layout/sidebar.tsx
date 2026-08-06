'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, GraduationCap, Users, Shield, Calendar, Activity, BarChart3, Settings, X } from 'lucide-react';

type NavItem = { href: string; label: string; icon: React.ReactNode; roles: string[] };

const items: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" />, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
  { href: '/learn', label: 'Learn', icon: <BookOpen className="h-4 w-4" />, roles: ['STUDENT'] },
  { href: '/viva', label: 'Viva', icon: <Calendar className="h-4 w-4" />, roles: ['STUDENT', 'INSTRUCTOR'] },
  { href: '/teacher', label: 'Teacher', icon: <GraduationCap className="h-4 w-4" />, roles: ['INSTRUCTOR', 'ADMIN'] },
  { href: '/admin/live', label: 'Live', icon: <Activity className="h-4 w-4" />, roles: ['ADMIN'] },
  { href: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" />, roles: ['ADMIN'] },
  { href: '/admin/courses', label: 'Courses', icon: <BookOpen className="h-4 w-4" />, roles: ['ADMIN'] },
  { href: '/admin/proctor', label: 'Proctor', icon: <Shield className="h-4 w-4" />, roles: ['ADMIN'] },
  { href: '/admin/activity', label: 'Activity', icon: <BarChart3 className="h-4 w-4" />, roles: ['ADMIN'] },
  { href: '/admin/system', label: 'System', icon: <Settings className="h-4 w-4" />, roles: ['ADMIN'] },
  { href: '/profile', label: 'Profile', icon: <Settings className="h-4 w-4" />, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
];

type Props = {
  role: string;
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ role, open, onClose }: Props) {
  const pathname = usePathname();
  const visible = items.filter((i) => i.roles.includes(role));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-56 flex-col border-r bg-white transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/" onClick={onClose} className="text-lg font-bold">Swadhyaya</Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            title="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {visible.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  active ? 'bg-emerald-100 text-emerald-900 font-medium' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

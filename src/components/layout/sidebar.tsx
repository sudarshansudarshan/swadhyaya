'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, GraduationCap, Users, Shield, Calendar, Activity, BarChart3, Settings } from 'lucide-react';

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

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const visible = items.filter((i) => i.roles.includes(role));

  return (
    <aside className="w-56 border-r bg-white">
      <div className="p-4 border-b">
        <Link href="/" className="text-lg font-bold">Swadhyaya</Link>
      </div>
      <nav className="p-2 space-y-1">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
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
  );
}

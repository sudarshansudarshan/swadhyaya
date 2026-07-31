import Link from 'next/link';
import { LayoutDashboard, Users, BookOpen, Activity, Shield, Calendar, Settings, BarChart3, MessageSquare, Cpu } from 'lucide-react';

const adminLinks = [
  { href: '/admin/live', label: 'Live View', icon: Activity, desc: 'Real-time user grid' },
  { href: '/admin/activity', label: 'Activity Log', icon: BarChart3, desc: 'Chronological events' },
  { href: '/admin/users', label: 'Users', icon: Users, desc: 'Search & drill-down' },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen, desc: 'CRUD' },
  { href: '/admin/proctor', label: 'Proctor', icon: Shield, desc: 'Live sessions & anomalies' },
  { href: '/admin/viva', label: 'Viva', icon: Calendar, desc: 'Slots & bookings' },
  { href: '/admin/instructors', label: 'Instructors', icon: MessageSquare, desc: 'RBAC management' },
  { href: '/admin/system', label: 'System', icon: Cpu, desc: 'Metrics & health' },
];

export default function AdminIndexPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Console</h1>
      <p className="text-muted-foreground">Full control over Swadhyaya.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminLinks.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className="p-5 bg-white border rounded-xl hover:shadow-md transition"
            >
              <Icon className="h-6 w-6 text-emerald-600" />
              <div className="mt-2 font-semibold">{l.label}</div>
              <div className="text-sm text-muted-foreground">{l.desc}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

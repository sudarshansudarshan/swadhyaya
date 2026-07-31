import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { AdminUserSearch } from '@/components/admin/AdminUserSearch';

export default async function AdminUsersPage() {
  await requireAdmin();

  const cohorts = await prisma.cohort.findMany();
  const courses = await prisma.course.findMany();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Search and drill-down to any user</p>
      </div>

      <AdminUserSearch cohorts={cohorts} courses={courses} />
    </div>
  );
}

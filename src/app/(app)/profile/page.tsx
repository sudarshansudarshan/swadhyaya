import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { cohort: true },
  });
  if (!fullUser) redirect('/login');

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="bg-white border rounded-xl p-6 space-y-3">
        <Field label="Name" value={fullUser.name ?? '—'} />
        <Field label="Email" value={fullUser.email} />
        <Field label="Role" value={fullUser.role} />
        <Field label="Cohort" value={fullUser.cohort?.name ?? '—'} />
        <Field label="Joined" value={new Date(fullUser.createdAt).toLocaleString()} />
        {fullUser.samagamaSub && (
          <Field label="samagama.in sub" value={fullUser.samagamaSub} />
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

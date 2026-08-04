import { notFound } from 'next/navigation';
import { getActivity, ACTIVITIES } from '@/lib/activities';
import { ActivityRunner } from './activity-runner';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ itemId?: string; min?: string; title?: string; return?: string }>;
};

export const dynamicParams = true;

export function generateStaticParams() {
  return ACTIVITIES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const meta = getActivity(slug);
  if (!meta) return { title: 'Activity' };
  return {
    title: `${meta.title} · ${meta.figure}`,
    description: meta.short,
  };
}

export default async function ActivityPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const meta = getActivity(slug);
  if (!meta) notFound();

  return (
    <ActivityRunner
      slug={slug}
      title={meta.title}
      figure={meta.figure}
      topic={meta.topic}
      itemId={sp.itemId ?? null}
      minSeconds={Math.max(30, Number(sp.min) || 60)}
      returnHref={sp.return ?? null}
    />
  );
}

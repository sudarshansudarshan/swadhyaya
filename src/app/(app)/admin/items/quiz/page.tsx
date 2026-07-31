import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { QuestionBank } from '@/components/admin/QuestionBank';

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string }>;
}) {
  await requireAdmin();
  const { topicId } = await searchParams;

  const where: any = {};
  if (topicId) where.topicId = topicId;

  const questions = await prisma.question.findMany({
    where,
    take: 200,
    orderBy: [{ topicId: 'asc' }, { id: 'asc' }],
  });

  const topics = await prisma.question.groupBy({
    by: ['topicId'],
    _count: { id: true },
    orderBy: { topicId: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground">{questions.length} question(s) · {topics.length} topic(s)</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/items/quiz/import"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium"
          >
            Bulk Import
          </a>
        </div>
      </div>

      <QuestionBank
        initialQuestions={questions.map((q) => ({
          id: q.id,
          topicId: q.topicId,
          prompt: q.prompt,
          options: q.options as any,
          explanation: q.explanation,
          tags: q.tags,
          difficulty: q.difficulty,
          source: q.source,
        }))}
        topics={topics.map((t) => ({ topicId: t.topicId, count: t._count.id }))}
        currentTopic={topicId}
      />
    </div>
  );
}

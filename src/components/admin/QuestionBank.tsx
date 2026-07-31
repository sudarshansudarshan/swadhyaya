'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Question = {
  id: string;
  topicId: string;
  prompt: string;
  options: { text: string; correct: boolean }[];
  explanation?: string | null;
  tags: string[];
  difficulty: string;
  source: string;
};

export function QuestionBank({
  initialQuestions,
  topics,
  currentTopic,
}: {
  initialQuestions: Question[];
  topics: { topicId: string; count: number }[];
  currentTopic?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState(currentTopic ?? '');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => { setFilter(''); router.push('/admin/items/quiz'); }}
          className={`px-3 py-1 text-sm rounded-full border ${
            !filter ? 'bg-emerald-100 border-emerald-300' : 'bg-white'
          }`}
        >
          All ({topics.reduce((s, t) => s + t.count, 0)})
        </button>
        {topics.map((t) => (
          <button
            key={t.topicId}
            onClick={() => { setFilter(t.topicId); router.push(`/admin/items/quiz?topicId=${t.topicId}`); }}
            className={`px-3 py-1 text-sm rounded-full border ${
              filter === t.topicId ? 'bg-emerald-100 border-emerald-300' : 'bg-white'
            }`}
          >
            {t.topicId} ({t.count})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {initialQuestions.map((q) => (
          <QuestionRow key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}

function QuestionRow({ question }: { question: Question }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1">
            {question.topicId} · {question.difficulty} · {question.tags.join(', ')}
          </div>
          <div className="font-medium">{question.prompt}</div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-sm">
            {question.options.map((opt, i) => (
              <div
                key={i}
                className={`p-2 border rounded ${
                  opt.correct ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                }`}
              >
                {opt.correct ? '✓' : '○'} {opt.text}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm text-emerald-600 hover:underline"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>
      {editing && (
        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
          Inline editor coming in next commit. Use the API for now: PATCH /api/admin/questions/[id]
        </div>
      )}
    </div>
  );
}

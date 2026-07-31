'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MuxVideoPlayer } from '@/components/video/MuxVideoPlayer';
import { ActivityFrame } from '@/components/activity/ActivityFrame';
import { QuizApp } from '@/components/quiz/QuizApp';
import { EthicsConsent } from '@/components/ethics/EthicsConsent';
import { ProctorPanel } from '@/components/proctor/ProctorPanel';
import { useLiveHeartbeat } from '@/hooks/useLiveHeartbeat';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type Item = {
  id: string;
  type: 'VIDEO' | 'ACTIVITY' | 'QUIZ';
  title: string;
  description: string | null;
  muxPlaybackId: string | null;
  videoStartTime: string | null;
  videoEndTime: string | null;
  videoMinWatchSeconds: number;
  activityHtmlSlug: string | null;
  activityMinSeconds: number;
  quizQuestionCount: number;
  quizPassThreshold: number;
  quizTimeLimit: number;
};

type Question = {
  id: string;
  prompt: string;
  options: { text: string; correct: boolean }[];
  explanation?: string;
};

type Props = {
  item: Item;
  progress: any;
  questions: Question[];
  userId: string;
  sectionTitle: string;
  backHref: string;
};

export function ItemClient({ item, progress, questions, userId, sectionTitle, backHref }: Props) {
  const router = useRouter();
  const [showConsent, setShowConsent] = useState(
    !progress && (item.type === 'VIDEO' || item.type === 'QUIZ')
  );
  const [busy, setBusy] = useState(false);

  useLiveHeartbeat(() => ({
    page: window.location.pathname,
    itemId: item.id,
    itemType: item.type,
  }));

  const handleConsent = useCallback(async () => {
    await fetch('/api/ethics/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id }),
    });
    setShowConsent(false);
  }, [item.id]);

  async function markVideoWatched() {
    setBusy(true);
    try {
      await fetch('/api/progress/video-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function markActivityComplete() {
    setBusy(true);
    try {
      await fetch('/api/progress/activity-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitQuiz(answers: { questionId: string; selectedIndex: number; correct: boolean }[]) {
    setBusy(true);
    try {
      const res = await fetch('/api/progress/quiz-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, answers }),
      });
      const data = await res.json();
      if (data.passed) {
        router.refresh();
      } else {
        alert(`You scored ${data.correct}/${data.total}. You need ${item.quizPassThreshold} to pass. Try again.`);
      }
    } finally {
      setBusy(false);
    }
  }

  if (showConsent) {
    return (
      <EthicsConsent
        onAccept={handleConsent}
        onDecline={() => router.push(backHref)}
      />
    );
  }

  return (
    <ProctorPanel itemId={item.id}>
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center gap-2 text-sm">
          <Link href={backHref} className="flex items-center text-muted-foreground hover:text-gray-900">
            <ChevronLeft className="h-4 w-4" /> {sectionTitle}
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
          {item.description && <p className="text-muted-foreground mt-1">{item.description}</p>}
        </div>

        {item.type === 'VIDEO' && (
          <>
            <MuxVideoPlayer
              muxPlaybackId={item.muxPlaybackId ?? ''}
              startTime={item.videoStartTime ?? '00:00:00'}
              endTime={item.videoEndTime ?? undefined}
              onEnded={markVideoWatched}
            />
            {progress?.videoCompleted && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                ✓ You have already watched this video. You may proceed.
              </div>
            )}
            <button
              onClick={markVideoWatched}
              disabled={busy}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : progress?.videoCompleted ? 'Continue' : 'Mark as Watched'}
            </button>
          </>
        )}

        {item.type === 'ACTIVITY' && item.activityHtmlSlug && (
          <ActivityFrame
            slug={item.activityHtmlSlug}
            minSeconds={item.activityMinSeconds}
            onComplete={markActivityComplete}
          />
        )}

        {item.type === 'QUIZ' && (
          <QuizApp
            questions={questions}
            passThreshold={item.quizPassThreshold}
            timeLimit={item.quizTimeLimit || undefined}
            onSubmit={submitQuiz}
          />
        )}
      </div>
    </ProctorPanel>
  );
}

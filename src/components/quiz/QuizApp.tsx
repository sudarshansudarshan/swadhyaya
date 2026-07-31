'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';

type Question = {
  id: string;
  prompt: string;
  options: { text: string; correct: boolean }[];
  explanation?: string;
  invalidated?: boolean;
};

type Props = {
  questions: Question[];
  passThreshold: number;
  timeLimit?: number;
  onSubmit: (answers: { questionId: string; selectedIndex: number; correct: boolean }[]) => Promise<void>;
};

export function QuizApp({ questions, passThreshold, timeLimit, onSubmit }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number; correct: boolean }[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  useEffect(() => {
    setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
  }, [questions]);

  useEffect(() => {
    if (!timeLimit) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timeLimit]);

  const current = shuffledQuestions[currentIndex];
  if (!current) return null;

  function handleSubmit() {
    if (selectedIndex === null) return;
    const correct = current.options[selectedIndex].correct;
    setAnswers((a) => [...a, { questionId: current.id, selectedIndex, correct }]);
    setShowFeedback(true);
  }

  function handleNext() {
    if (currentIndex + 1 < shuffledQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedIndex(null);
      setShowFeedback(false);
      setShowExplanation(false);
    } else {
      finish();
    }
  }

  async function finish() {
    setSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setSubmitting(false);
    }
  }

  const correctCount = answers.filter((a) => a.correct).length;
  const finished = currentIndex + 1 >= shuffledQuestions.length && showFeedback;
  const timeLeft = timeLimit ? Math.max(0, timeLimit - elapsed) : null;
  const timeOver = timeLimit && elapsed >= timeLimit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-white border rounded-xl">
        <div className="text-sm">
          Question {currentIndex + 1} of {shuffledQuestions.length}
        </div>
        <div className="flex items-center gap-4 text-sm">
          {timeLeft !== null && (
            <span className={timeOver ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
              <Clock className="inline h-4 w-4 mr-1" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          )}
          <span>{correctCount} correct so far · pass {passThreshold}</span>
        </div>
      </div>

      <div className="p-6 bg-white border rounded-xl space-y-4">
        {current.invalidated && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
            ⚠️ This question was cancelled. Your answer will not be counted, but you must answer it.
          </div>
        )}

        <div className="text-lg font-medium">{current.prompt}</div>

        <div className="space-y-2">
          {current.options.map((opt, idx) => {
            const isSelected = selectedIndex === idx;
            const isCorrect = opt.correct;

            let cls = 'border-gray-200 hover:border-gray-400';
            if (showFeedback) {
              if (isCorrect) cls = 'border-emerald-500 bg-emerald-50';
              else if (isSelected) cls = 'border-red-500 bg-red-50';
            } else if (isSelected) {
              cls = 'border-emerald-500 bg-emerald-50';
            }

            return (
              <button
                key={idx}
                onClick={() => !showFeedback && setSelectedIndex(idx)}
                disabled={showFeedback}
                className={`w-full p-3 text-left border-2 rounded-lg transition ${cls}`}
              >
                <div className="flex items-center gap-2">
                  {showFeedback && isCorrect && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                  {showFeedback && !isCorrect && isSelected && <XCircle className="h-4 w-4 text-red-600" />}
                  <span>{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>

        {showFeedback && current.explanation && (
          <div className="mt-4">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-sm text-emerald-600 hover:underline"
            >
              {showExplanation ? 'Hide' : 'Show'} explanation
            </button>
            {showExplanation && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-line">
                {current.explanation}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4">
          {!showFeedback ? (
            <button
              onClick={handleSubmit}
              disabled={selectedIndex === null}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={submitting}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {finished ? (submitting ? 'Submitting…' : 'Finish Quiz') : 'Next'} <ChevronRight className="inline h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

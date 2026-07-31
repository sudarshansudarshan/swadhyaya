'use client';

import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  PartyPopper,
  AlertCircle,
} from 'lucide-react';

type Question = {
  id: string;
  prompt: string;
  options: { text: string; correct: boolean }[];
  explanation?: string;
  invalidated?: boolean;
};

type ShuffledOption = { text: string; correct: boolean; originalIndex: number };
type ShuffledQuestion = {
  id: string;
  prompt: string;
  options: ShuffledOption[];
  explanation?: string;
  invalidated?: boolean;
};

type SubmittedAnswer = { questionId: string; selectedIndex: number; correct: boolean };

type SubmitResult = {
  score: number;
  total: number;
  passed: boolean;
  needsReAnswer?: boolean;
  redirectTo?: string | null;
};

type Props = {
  questions: Question[];
  passThreshold: number;
  timeLimit?: number;
  onSubmit: (answers: SubmittedAnswer[]) => Promise<SubmitResult | void>;
  onNext: () => void;
  onRewatchVideo: () => void;
  redirectDelaySeconds?: number;
};

const DEFAULT_REDIRECT_DELAY = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildShuffled(questions: Question[]): ShuffledQuestion[] {
  return shuffle(
    questions.map((q) => ({
      ...q,
      options: shuffle(q.options.map((opt, i) => ({ ...opt, originalIndex: i }))),
    })),
  );
}

export function QuizApp({
  questions,
  passThreshold,
  timeLimit,
  onSubmit,
  onNext,
  onRewatchVideo,
  redirectDelaySeconds = DEFAULT_REDIRECT_DELAY,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<SubmittedAnswer[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>(() => buildShuffled(questions));
  const [prevQuestions, setPrevQuestions] = useState(questions);
  if (questions !== prevQuestions) {
    setPrevQuestions(questions);
    setShuffledQuestions(buildShuffled(questions));
  }

  useEffect(() => {
    if (!timeLimit) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timeLimit]);

  const current = shuffledQuestions[currentIndex];

  function handleSubmit() {
    if (selectedIndex === null) return;
    const opt = current.options[selectedIndex];
    const correct = opt.correct;
    setAnswers((a) => [...a, { questionId: current.id, selectedIndex: opt.originalIndex, correct }]);
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
    setSubmitError(null);
    try {
      const res = await onSubmit(answers);
      if (res) {
        setResult(res);
      } else {
        onNext();
      }
    } catch {
      setSubmitError('Something went wrong while submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-redirect back to the section video when the quiz fails. The initial
  // countdown value is set via the render-phase adjustment below (guarded by
  // `redirectCountdown === null`) so the effect only performs async updates.
  const onRewatchVideoRef = useRef(onRewatchVideo);
  useEffect(() => {
    onRewatchVideoRef.current = onRewatchVideo;
  }, [onRewatchVideo]);

  if (result && !result.passed && !result.needsReAnswer && redirectCountdown === null) {
    setRedirectCountdown(redirectDelaySeconds);
  }

  useEffect(() => {
    if (!result || result.passed || result.needsReAnswer) return;
    const id = setInterval(() => {
      setRedirectCountdown((c) => {
        if (c === null) return null;
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [result]);

  useEffect(() => {
    if (redirectCountdown === 0) onRewatchVideoRef.current();
  }, [redirectCountdown]);

  const correctCount = answers.filter((a) => a.correct).length;
  const finished = currentIndex + 1 >= shuffledQuestions.length && showFeedback;
  const timeLeft = timeLimit ? Math.max(0, timeLimit - elapsed) : null;
  const timeOver = timeLimit && elapsed >= timeLimit;

  if (result) {
    const percent = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    const isPerfect = result.total > 0 && result.score >= result.total;
    const answersByQuestion = new Map(answers.map((a) => [a.questionId, a]));

    return (
      <div className="mx-auto max-w-3xl">
        <div className="bg-white border rounded-xl shadow-sm">
          <div className="px-8 pt-8 pb-2 text-center">
            <h2 className="text-3xl font-bold">Quiz Completed!</h2>
            <p className="mt-1 text-muted-foreground">Great job! Here are your results.</p>
          </div>
          <div className="px-8 py-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-emerald-700">
                {result.score}/{result.total}
              </div>
              <p className="text-xl text-muted-foreground">You scored {percent}%</p>
              <div className="flex items-center justify-center gap-2">
                {result.passed ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                    <PartyPopper className="h-4 w-4" /> Passed!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    <XCircle className="h-4 w-4" /> Attempt Unsuccessful
                  </span>
                )}
                {isPerfect && result.passed && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                    Perfect Score!
                  </span>
                )}
              </div>

              <div className="pt-4 flex flex-col items-center gap-3">
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={onRewatchVideo}
                    className="inline-flex items-center justify-center min-w-[180px] h-12 px-4 border-2 border-gray-200 hover:bg-gray-50 rounded-lg text-lg font-semibold transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Rewatch Video
                  </button>
                  {result.passed && (
                    <button
                      onClick={onNext}
                      className="inline-flex items-center justify-center min-w-[180px] h-12 px-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-lg font-semibold shadow-lg transition-all duration-200"
                    >
                      Next Lesson
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </button>
                  )}
                </div>
                {redirectCountdown !== null && (
                  <p className="text-sm text-red-600 font-medium animate-pulse">
                    Auto-redirecting in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}...
                  </p>
                )}
                {submitError && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {submitError}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Question Details</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {shuffledQuestions.map((question, index) => {
                  const answer = answersByQuestion.get(question.id);
                  const isCorrect = answer?.correct ?? false;
                  const userOption = answer
                    ? question.options.find((o) => o.originalIndex === answer.selectedIndex)
                    : null;
                  const correctOption = question.options.find((o) => o.correct);
                  const open = openQuestionId === question.id;

                  return (
                    <div
                      key={question.id}
                      className={`border rounded-lg ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-red-200 bg-red-50/50'
                      }`}
                    >
                      <div className="px-4 py-2">
                        <div
                          className="flex items-center justify-between cursor-pointer select-none"
                          onClick={() => setOpenQuestionId(open ? null : question.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 border border-gray-200 rounded-md text-xs text-muted-foreground">
                              Q{index + 1}
                            </span>
                            {isCorrect ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white rounded-full text-xs font-medium">
                                ✓ Correct
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded-full text-xs font-medium">
                                ✗ Incorrect
                              </span>
                            )}
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-muted-foreground transition-transform ${
                              open ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                        {open && (
                          <div className="mt-3 ml-2 space-y-3">
                            <p className="text-sm text-gray-700">{question.prompt}</p>
                            {userOption && (
                              <div className="p-2 bg-blue-50 rounded">
                                <p className="text-sm font-medium text-blue-700">
                                  Your Answer: {userOption.text}
                                </p>
                              </div>
                            )}
                            {correctOption && (
                              <div className="p-2 bg-green-50 rounded">
                                <p className="text-sm font-medium text-green-700">
                                  Correct Answer: {correctOption.text}
                                </p>
                              </div>
                            )}
                            {question.explanation && (
                              <div className="p-2 bg-amber-50 rounded">
                                <p className="text-sm font-medium text-amber-700 whitespace-pre-line">
                                  <strong>Explanation:</strong> {question.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

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

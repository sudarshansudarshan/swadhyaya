'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, Video, AlertTriangle } from 'lucide-react';

type Props = {
  onAccept: () => void | Promise<void>;
  onDecline: () => void;
};

export function EthicsConsent({ onAccept, onDecline }: Props) {
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      if (el.scrollHeight - el.clientHeight < 20) setScrolled(true);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  async function handleAccept() {
    setLoading(true);
    try {
      await onAccept();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold">Proctoring Consent</h2>
              <p className="text-sm text-muted-foreground">Required before starting this session</p>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="p-6 overflow-y-auto flex-1 space-y-4 text-sm"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
              setScrolled(true);
            }
          }}
        >
          <p>
            This learning session uses proctoring to ensure academic integrity. By continuing, you consent to the following:
          </p>

          <div className="space-y-3">
            <div className="flex gap-3">
              <Video className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Webcam & Microphone</div>
                <p className="text-muted-foreground">
                  Your webcam and microphone will be active during the session. Video is processed locally and only flagged screenshots are uploaded.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Activity Monitoring</div>
                <p className="text-muted-foreground">
                  Tab switching, copy/paste, dev tools, fullscreen exit, and other behaviors are detected and may flag your session.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Anomaly Recording</div>
                <p className="text-muted-foreground">
                  When anomalies are detected (multiple faces, no face, voice detected, etc.), a screenshot is captured and sent to the instructor for review.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Your privacy is important. All processing follows our data protection policy. You may withdraw consent at any time by ending the session.
          </p>
        </div>

        <div className="p-6 border-t flex gap-3 justify-end">
          <button
            onClick={onDecline}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            disabled={loading}
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={!scrolled || loading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting…' : 'I Consent — Start Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

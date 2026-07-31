'use client';

import { useEffect, useState } from 'react';
import { useCamera } from './hooks/useCamera';
import { FloatingVideo } from './FloatingVideo';
import { Shield, AlertTriangle } from 'lucide-react';

type Props = {
  itemId: string;
  onAnomaly?: (type: string, severity: number) => void;
  children: React.ReactNode;
};

export function ProctorPanel({ itemId, onAnomaly, children }: Props) {
  const { start, stop } = useCamera();
  const [graceCompleted, setGraceCompleted] = useState(false);
  const [readyToDetect, setReadyToDetect] = useState(false);
  const [anomalies, setAnomalies] = useState<string[]>([]);
  const [penaltyScore, setPenaltyScore] = useState(0);

  useEffect(() => {
    start();
    const t = setTimeout(() => setReadyToDetect(true), 1000);
    const t2 = setTimeout(() => setGraceCompleted(true), 10000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
      stop();
    };
  }, [start, stop]);

  useEffect(() => {
    if (!graceCompleted) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/proctor/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, readyToDetect: true }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.anomalies) {
          setAnomalies(data.anomalies);
          if (data.anomalies.length > 0 && onAnomaly) {
            onAnomaly(data.anomalies[0], 1);
          }
        }
        if (data.penaltyScore !== undefined) {
          setPenaltyScore(data.penaltyScore);
        }
      } catch {}
    }, 10_000);
    return () => clearInterval(id);
  }, [graceCompleted, itemId, onAnomaly]);

  return (
    <>
      <FloatingVideo proctorSessionId={itemId} anomalies={anomalies} />
      {anomalies.length > 0 && (
        <div className="fixed top-20 right-4 z-50 p-2 bg-amber-100 border border-amber-300 rounded-lg text-xs text-amber-800 flex items-center gap-2 max-w-xs">
          <AlertTriangle className="h-3 w-3" />
          <span>{anomalies[0].replace(/_/g, ' ')}</span>
        </div>
      )}
      {children}
    </>
  );
}

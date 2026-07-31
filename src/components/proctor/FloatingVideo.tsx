'use client';

import { useEffect, useRef, useState } from 'react';
import { useCamera } from './hooks/useCamera';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useLiveChannel } from '@/hooks/useLiveChannel';

type Props = {
  proctorSessionId?: string;
  anomalies: string[];
  onAnomaly?: (type: string, severity: number) => void;
};

export function FloatingVideo({ proctorSessionId, anomalies, onAnomaly }: Props) {
  const { videoRef, isRunning, error, start, stop } = useCamera();
  const [collapsed, setCollapsed] = useState(false);
  const [faceCount, setFaceCount] = useState(1);
  const lastAnomalyTime = useRef<Record<string, number>>({});

  useEffect(() => {
    if (proctorSessionId) {
      start();
    }
    return () => stop();
  }, [proctorSessionId, start, stop]);

  useEffect(() => {
    if (anomalies.length === 0) {
      setFaceCount(1);
      return;
    }
    if (anomalies.includes('noFace')) setFaceCount(0);
    else if (anomalies.includes('multipleFaces')) setFaceCount(2);
  }, [anomalies]);

  useLiveChannel(proctorSessionId ? `proctor-${proctorSessionId}` : null);

  if (error) {
    return (
      <div className="fixed top-4 right-4 z-50 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-800 flex items-center gap-2 max-w-xs">
        <AlertCircle className="h-4 w-4" /> Camera: {error}
      </div>
    );
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 bg-white border-2 rounded-xl shadow-lg overflow-hidden"
      style={{ width: collapsed ? 60 : 240 }}
    >
      <div className="flex items-center justify-between p-2 bg-gray-900 text-white text-xs">
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-gray-500'}`} />
          {isRunning ? (faceCount === 0 ? 'No face' : faceCount === 1 ? 'Live' : `${faceCount} faces`) : 'Off'}
        </span>
        <button onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </button>
      </div>
      {!collapsed && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', height: 180, background: '#000', objectFit: 'cover' }}
        />
      )}
    </div>
  );
}

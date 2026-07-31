'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraHandle = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  isRunning: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
};

export function useCamera(): CameraHandle {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsRunning(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera access denied');
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, streamRef, isRunning, error, start, stop };
}

'use client';

import { useEffect, useRef, useCallback } from 'react';

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled?: boolean;
  onAnomaly?: (isMotion: boolean) => void;
  threshold?: number;
};

export function useMotionDetector({ videoRef, enabled = false, onAnomaly, threshold = 600 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const graceRef = useRef(true);
  const prevRef = useRef<Float32Array | null>(null);
  const onRef = useRef(onAnomaly);

  useEffect(() => {
    onRef.current = onAnomaly;
  }, [onAnomaly]);

  useEffect(() => {
    if (enabled) {
      graceRef.current = true;
      const t = setTimeout(() => {
        graceRef.current = false;
      }, 10000);
      return () => clearTimeout(t);
    }
  }, [enabled]);

  const checkMotion = useCallback(() => {
    if (!enabled || graceRef.current) {
      onRef.current?.(false);
      return;
    }
    const video = videoRef?.current;
    if (!video || video.readyState < 2) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 160;
      canvasRef.current.height = 120;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const gray = new Float32Array(canvas.width * canvas.height);
    for (let i = 0; i < frame.length; i += 4) {
      gray[i / 4] = 0.299 * frame[i] + 0.587 * frame[i + 1] + 0.114 * frame[i + 2];
    }

    let diff = 0;
    if (prevRef.current) {
      const prev = prevRef.current;
      for (let i = 0; i < gray.length; i += 5) {
        const d = Math.abs(gray[i] - prev[i]);
        if (d > 20) diff++;
      }
    }
    prevRef.current = gray;
    onRef.current?.(diff > threshold);
  }, [enabled, videoRef, threshold]);

  useEffect(() => {
    if (!enabled) {
      onRef.current?.(false);
      prevRef.current = null;
      return;
    }
    intervalRef.current = setInterval(checkMotion, 1500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, checkMotion]);
}

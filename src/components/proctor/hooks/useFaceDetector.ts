'use client';

import { useEffect, useRef, useCallback } from 'react';

type FaceApiType = typeof import('face-api.js');

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled?: boolean;
  onAnomaly?: (data: { faceMissing?: boolean; multipleFaces?: boolean; noFace?: boolean; faceExpression?: string }) => void;
};

export function useFaceDetector({ videoRef, enabled = false, onAnomaly }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceapiRef = useRef<FaceApiType | null>(null);
  const loadingRef = useRef(false);
  const modelsLoadedRef = useRef(false);
  const graceRef = useRef(true);
  const onRef = useRef(onAnomaly);
  const stoppedRef = useRef(false);

  useEffect(() => {
    onRef.current = onAnomaly;
  }, [onAnomaly]);

  const loadModels = useCallback(async () => {
    if (modelsLoadedRef.current || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const faceapi = await import('face-api.js');
      await faceapi.nets.tinyFaceDetector.loadFromUri(`${window.location.origin}/models`);
      await faceapi.nets.faceExpressionNet.loadFromUri(`${window.location.origin}/models`);
      faceapiRef.current = faceapi;
      modelsLoadedRef.current = true;
    } catch (err) {
      console.error('[proctor] face-api models failed to load', err);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const detectFace = useCallback(async () => {
    if (stoppedRef.current) return;
    const video = videoRef?.current;
    const faceapi = faceapiRef.current;
    if (!video || !faceapi || !enabled || graceRef.current) return;
    if (video.readyState < 2) return;

    try {
      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 }),
      );
      if (stoppedRef.current) return;
      onRef.current?.({
        noFace: detections.length === 0,
        multipleFaces: detections.length > 1,
        faceMissing: detections.length === 0,
      });
      if (detections.length === 1) {
        const expressions = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 })).withFaceExpressions();
        if (!stoppedRef.current && expressions?.expressions) {
          const sorted = Object.entries(expressions.expressions).sort((a, b) => b[1] - a[1]);
          if (sorted[0] && (sorted[0][0] === 'sad' || sorted[0][0] === 'disgusted' || sorted[0][0] === 'angry')) {
            onRef.current?.({ faceExpression: sorted[0][0] });
          }
        }
      }
    } catch (err) {
      console.error('[proctor] face detection error', err);
    }
  }, [enabled, videoRef]);

  useEffect(() => {
    if (enabled) {
      graceRef.current = true;
      const t = setTimeout(() => {
        graceRef.current = false;
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    loadModels();
    const interval = setInterval(() => {
      void detectFace();
    }, 1200);
    intervalRef.current = interval;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, loadModels, detectFace]);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}

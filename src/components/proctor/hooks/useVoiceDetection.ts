'use client';

import { useEffect, useRef, useCallback } from 'react';

type Props = {
  enabled?: boolean;
  onAnomaly?: (data: { voiceDetected?: boolean; level?: number }) => void;
  threshold?: number;
};

export function useVoiceDetection({ enabled = false, onAnomaly, threshold = 30 }: Props) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const graceRef = useRef(true);
  const onRef = useRef(onAnomaly);

  useEffect(() => {
    onRef.current = onAnomaly;
  }, [onAnomaly]);

  useEffect(() => {
    if (enabled) {
      graceRef.current = true;
      const t = setTimeout(() => {
        graceRef.current = false;
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [enabled]);

  const checkVoice = useCallback(() => {
    if (!enabled || graceRef.current) return;
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    const avg = sum / dataArray.length;

    onRef.current?.({ voiceDetected: avg > threshold, level: Math.round(avg) });
  }, [enabled, threshold]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;
        sourceRef.current = source;

        intervalRef.current = setInterval(checkVoice, 1500);
      } catch (err) {
        console.warn('[proctor] voice detection unavailable', err);
      }
    };

    void setup();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      try {
        sourceRef.current?.disconnect();
        void audioCtxRef.current?.close();
      } catch {
        /* noop */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      sourceRef.current = null;
      analyserRef.current = null;
      audioCtxRef.current = null;
      streamRef.current = null;
    };
  }, [enabled, checkVoice]);
}

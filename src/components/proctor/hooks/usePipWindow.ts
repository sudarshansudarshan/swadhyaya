'use client';

import { useEffect, useRef, useCallback } from 'react';

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled?: boolean;
};

export function usePipWindow({ videoRef, enabled = false }: Props) {
  const lastEnabledRef = useRef(enabled);
  const pippRef = useRef<boolean | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  const enterPip = useCallback(async () => {
    const video = videoRef.current;
    if (!video || typeof document.exitPictureInPicture !== 'function') return;
    try {
      if (document.pictureInPictureElement) return;
      await video.requestPictureInPicture();
      pippRef.current = true;
    } catch {
      /* PiP unsupported or denied */
    }
  }, [videoRef]);

  const exitPip = useCallback(async () => {
    if (!pippRef.current || typeof document.exitPictureInPicture !== 'function') return;
    try {
      await document.exitPictureInPicture();
    } catch {
      /* noop */
    }
    pippRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const video = videoRef.current;
    if (!video) return;
    if ('srcObject' in video && video.srcObject instanceof MediaStream) {
      const track = video.srcObject.getVideoTracks()[0];
      videoTrackRef.current = track ?? null;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) void enterPip();
    }, 1500);

    const onEntered = () => {
      pippRef.current = true;
    };
    const onLeft = () => {
      pippRef.current = false;
    };

    video.addEventListener('enterpictureinpicture', onEntered);
    video.addEventListener('leavepictureinpicture', onLeft);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      video.removeEventListener('enterpictureinpicture', onEntered);
      video.removeEventListener('leavepictureinpicture', onLeft);
      void exitPip();
    };
  }, [enabled, enterPip, exitPip, videoRef]);

  useEffect(() => {
    lastEnabledRef.current = enabled;
  }, [enabled]);
}

'use client';

import { useEffect, useState } from 'react';
import { useProctor, RIGHT_CLICK_FAIL_THRESHOLD } from './ProctorProvider';
import { Camera, VideoOff, ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';

export function FloatingVideo() {
  const { videoRef, isCameraOn, cameraError, anomalies, errorMode, countdown, startCamera, stopCamera } =
    useProctor();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const latest = anomalies.length > 0 ? anomalies[anomalies.length - 1] : null;

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!latest) return;
    const label = latest.type.replace(/_/g, ' ');
    const count = latest.metadata?.rightClickCount as number | undefined;
    const text = count !== undefined ? `${label} (${count}/${RIGHT_CLICK_FAIL_THRESHOLD})` : label;
    const raf = requestAnimationFrame(() => setToast(text));
    const t = setTimeout(() => setToast(null), 4000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [latest]);

  const open = pinned || hovered;

  if (cameraError) {
    return (
      <div className="fixed top-4 right-4 z-50 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-800 flex items-center gap-2 max-w-xs">
        <AlertCircle className="h-4 w-4" /> Camera: {cameraError}
      </div>
    );
  }

  return (
    <div
      className="fixed left-4 top-1/2 z-50 -translate-y-1/2 sm:left-6"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => setPinned((p) => !p)}
        aria-label={pinned ? 'Hide camera preview' : 'Show camera preview'}
        aria-pressed={pinned}
        className={`grid h-9 w-9 place-items-center rounded-full bg-white text-foreground shadow-lg ring-1 backdrop-blur-md transition hover:scale-105 hover:opacity-100 dark:bg-neutral-800 ${
          errorMode ? 'ring-red-500' : 'ring-emerald-500'
        } ${pinned ? 'opacity-100' : 'opacity-60'}`}
      >
        <Camera className="h-4 w-4" />
      </button>

      <div
        className={`absolute left-full top-1/2 ml-3 -translate-y-1/2 transition-all duration-200 ${
          open
            ? 'pointer-events-auto opacity-100 translate-x-0'
            : 'pointer-events-none opacity-0 -translate-x-2'
        }`}
      >
        <div
          className={`w-52 rounded-2xl bg-white/95 p-2 text-foreground shadow-xl ring-1 backdrop-blur-md dark:bg-neutral-900/95 ${
            errorMode ? 'ring-red-500' : 'ring-emerald-500/70'
          }`}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!isCameraOn && (
              <div className="absolute inset-0 grid place-items-center text-white/70">
                <div className="flex flex-col items-center gap-1.5">
                  <VideoOff className="h-5 w-5" />
                  <span className="text-[10px]">Starting camera…</span>
                </div>
              </div>
            )}
            <div
              className={`pointer-events-none absolute inset-[6%] rounded-md ring-2 ${
                errorMode ? 'ring-red-500' : 'ring-emerald-400/80'
              }`}
            />
            <div
              className={`absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white ${
                errorMode ? 'bg-red-600' : 'bg-emerald-600'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {errorMode ? 'ALERT' : isCameraOn ? 'LIVE' : 'OFF'}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 px-1 pb-0.5 text-xs">
            {errorMode ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                <span className="opacity-90">Violation detected</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span className="opacity-90">{toast ? toast : 'All clear'}</span>
              </>
            )}
            <span className="ml-auto text-[10px] opacity-60">proctoring</span>
          </div>
        </div>

        {errorMode && (
          <div className="mt-2 p-3 bg-red-600 border border-red-700 rounded-lg text-sm text-white flex items-center gap-2 max-w-xs shadow-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Proctoring violation detected{toast ? ` (${toast})` : ''}. Returning to the section video in {countdown}s…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

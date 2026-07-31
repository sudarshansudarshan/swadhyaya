'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ProctorAnomaly, ProctorEventType } from '@/types/proctor';
import { useCamera } from './hooks/useCamera';
import { useTabSwitch } from './hooks/useTabSwitch';
import { useAntiCheat } from './hooks/useAntiCheat';
import { useBlurDetector } from './hooks/useBlurDetector';
import { useMotionDetector } from './hooks/useMotionDetector';
import { useFaceDetector } from './hooks/useFaceDetector';
import { useVoiceDetection } from './hooks/useVoiceDetection';
import { useScreenActivity } from './hooks/useScreenActivity';
import { usePipWindow } from './hooks/usePipWindow';
import {
  startProctorSession,
  endProctorSession,
  reportProctorEvent,
  captureScreenshot,
  flushPendingEvents,
} from '@/lib/proctor/proctorEvents';

const COUNTDOWN_SECONDS = 5;
const DEDUPE_MS = 4000;
export const RIGHT_CLICK_FAIL_THRESHOLD = 3;

type ProctorContextValue = {
  enabled: boolean;
  sessionId: string | null;
  anomalies: ProctorAnomaly[];
  errorMode: boolean;
  countdown: number;
  isCameraOn: boolean;
  cameraError: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  reportAnomaly: (type: ProctorEventType, severity?: number, metadata?: Record<string, unknown>) => void;
};

const ProctorContext = createContext<ProctorContextValue | null>(null);

export function useProctor() {
  const ctx = useContext(ProctorContext);
  if (!ctx) throw new Error('useProctor must be used within ProctorProvider');
  return ctx;
}

type Props = {
  itemId: string;
  onFail?: () => void;
  children: React.ReactNode;
};

export function ProctorProvider({ itemId, onFail, children }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<ProctorAnomaly[]>([]);
  const [errorMode, setErrorMode] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const camera = useCamera();
  const videoRef = camera.videoRef;

  const lastReportedRef = useRef<Record<string, number>>({});
  const idRef = useRef(0);
  const violationsRef = useRef(new Set<ProctorEventType>());
  const countdownRef = useRef(COUNTDOWN_SECONDS);
  const failTriggeredRef = useRef(false);
  const rightClickCountRef = useRef(0);
  const onFailRef = useRef(onFail);

  useEffect(() => {
    onFailRef.current = onFail;
  }, [onFail]);

  useEffect(() => {
    const t = setTimeout(() => setEnabled(true), 10_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void startProctorSession(itemId).then((id) => {
      if (!cancelled && id) setSessionId(id);
    });
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  useEffect(() => {
    if (!sessionId) return;
    void flushPendingEvents();
    return () => {
      void endProctorSession(sessionId);
    };
  }, [sessionId]);

  const triggerFail = useCallback(() => {
    if (failTriggeredRef.current) return;
    failTriggeredRef.current = true;
    onFailRef.current?.();
  }, []);

  const reportAnomaly = useCallback(
    (type: ProctorEventType, severity?: number, metadata?: Record<string, unknown>) => {
      const now = Date.now();
      if (!enabled && type !== 'tab_switch' && type !== 'tab_blur' && type !== 'right_click' && type !== 'copy_paste' && type !== 'devtools') return;

      const last = lastReportedRef.current[type] ?? 0;
      if (now - last < DEDUPE_MS) return;
      lastReportedRef.current[type] = now;

      const screenshot = camera.videoRef.current ? captureScreenshot(camera.videoRef.current) : null;

      const anomaly: ProctorAnomaly = {
        id: ++idRef.current,
        timestamp: now,
        type,
        severity: severity ?? 1,
        screenshot,
        metadata,
      };

      setAnomalies((prev) => [...prev, anomaly]);

      if (sessionId) {
        void reportProctorEvent(sessionId, type, severity, metadata, screenshot);
      }
    },
    [enabled, sessionId, camera.videoRef],
  );

  const addViolation = useCallback(
    (type: ProctorEventType) => {
      const wasEmpty = violationsRef.current.size === 0;
      violationsRef.current.add(type);
      if (wasEmpty) {
        countdownRef.current = COUNTDOWN_SECONDS;
        setCountdown(COUNTDOWN_SECONDS);
        setErrorMode(true);
      }
      reportAnomaly(type);
    },
    [reportAnomaly],
  );

  const removeViolation = useCallback((type: ProctorEventType) => {
    if (violationsRef.current.delete(type) && violationsRef.current.size === 0) {
      setErrorMode(false);
      setCountdown(COUNTDOWN_SECONDS);
    }
  }, []);

  useEffect(() => {
    if (!errorMode) return;
    countdownRef.current = COUNTDOWN_SECONDS;
    const id = setInterval(() => {
      countdownRef.current -= 1;
      if (countdownRef.current <= 0) {
        clearInterval(id);
        triggerFail();
      } else {
        setCountdown(countdownRef.current);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [errorMode, triggerFail]);

  useTabSwitch({
    enabled: true,
    onTabSwitch: () => {
      addViolation('tab_switch');
    },
    onTabReturn: () => {
      removeViolation('tab_switch');
    },
  });

  useAntiCheat({
    enabled: true,
    onViolation: (evt) => {
      const type = evt.type as ProctorEventType;
      if (type === 'right_click') {
        // Right-click fails after 3 presses in a single session — immediate
        // jump back, no countdown. Presses 1-2 are logged as warnings only.
        rightClickCountRef.current += 1;
        reportAnomaly(type, 1, { rightClickCount: rightClickCountRef.current });
        if (rightClickCountRef.current >= RIGHT_CLICK_FAIL_THRESHOLD) {
          triggerFail();
        }
      } else if (type === 'copy_paste' || type === 'devtools') {
        addViolation(type);
      }
    },
  });

  useBlurDetector({
    videoRef,
    enabled,
    onAnomaly: (isBlur) => {
      if (isBlur) addViolation('blur_detected');
      else removeViolation('blur_detected');
    },
  });

  useMotionDetector({
    videoRef,
    enabled,
    onAnomaly: (isMotion) => {
      if (isMotion) addViolation('motion_detected');
      else removeViolation('motion_detected');
    },
  });

  useFaceDetector({
    videoRef,
    enabled,
    onAnomaly: (data) => {
      if (data.noFace) addViolation('no_face');
      else removeViolation('no_face');
      if (data.multipleFaces) addViolation('multiple_faces');
      else removeViolation('multiple_faces');
    },
  });

  useVoiceDetection({
    enabled,
    onAnomaly: (data) => {
      if (data.voiceDetected) addViolation('voice_detected');
      else removeViolation('voice_detected');
    },
  });

  useScreenActivity({
    enabled,
    onIdle: () => {
      /* idle is not treated as a failing violation */
    },
  });

  usePipWindow({ videoRef, enabled });

  return (
    <ProctorContext.Provider
      value={{
        enabled,
        sessionId,
        anomalies,
        errorMode,
        countdown,
        isCameraOn: camera.isRunning,
        cameraError: camera.error,
        videoRef,
        startCamera: camera.start,
        stopCamera: camera.stop,
        reportAnomaly,
      }}
    >
      {children}
    </ProctorContext.Provider>
  );
}

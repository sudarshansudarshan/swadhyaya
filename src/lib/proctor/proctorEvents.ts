import type { ProctorEventType } from '@/types/proctor';

export const SEVERITY: Record<ProctorEventType, number> = {
  tab_switch: 2,
  tab_blur: 1,
  no_face: 1,
  multiple_faces: 3,
  blur_detected: 2,
  motion_detected: 2,
  voice_detected: 3,
  virtual_camera: 3,
  right_click: 1,
  copy_paste: 2,
  devtools: 3,
  idle: 1,
  camera_covered: 2,
  camera_overexposed: 2,
  face_mismatch: 3,
  ejected: 5,
};

const QUEUE_KEY = 'proctor_pending_events';

export function captureScreenshot(
  video: HTMLVideoElement,
  width = 320,
  height = 240,
): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.5);
  } catch {
    return null;
  }
}

function readQueue(): Array<Record<string, unknown>> {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeQueue(queue: Array<Record<string, unknown>>) {
  try {
    if (queue.length === 0) localStorage.removeItem(QUEUE_KEY);
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* storage full or unavailable */
  }
}

export async function flushPendingEvents() {
  const queue = readQueue();
  if (queue.length === 0) return;
  const remaining: Array<Record<string, unknown>> = [];
  for (const evt of queue) {
    try {
      const res = await fetch('/api/proctor/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt),
      });
      if (!res.ok) remaining.push(evt);
    } catch {
      remaining.push(evt);
    }
  }
  writeQueue(remaining);
}

export async function reportProctorEvent(
  sessionId: string,
  type: ProctorEventType,
  severity?: number,
  metadata?: Record<string, unknown>,
  screenshot?: string | null,
  retries = 3,
): Promise<number | null> {
  const payload = {
    sessionId,
    type,
    severity: severity ?? SEVERITY[type] ?? 1,
    metadata,
    screenshot,
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch('/api/proctor/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return typeof data.penaltyScore === 'number' ? data.penaltyScore : null;
      }
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    } catch {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  const queue = readQueue();
  queue.push(payload);
  writeQueue(queue);
  return null;
}

export async function startProctorSession(itemId: string): Promise<string | null> {
  try {
    const res = await fetch('/api/proctor/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sessionId ?? null;
  } catch {
    return null;
  }
}

export async function endProctorSession(sessionId: string): Promise<void> {
  try {
    await fetch('/api/proctor/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
  } catch {
    /* best effort */
  }
}

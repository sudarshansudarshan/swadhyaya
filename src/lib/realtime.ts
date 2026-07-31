/**
 * Real-time broadcast.
 * - In production: uses Vercel KV + SSE
 * - In local dev: uses in-process EventEmitter (free, no setup)
 */
const useInProcess = process.env.USE_IN_PROCESS_PUBSUB === '1';

let kv: any = null;
if (!useInProcess) {
  try {
    const { kv: vercelKv } = await import('@vercel/kv');
    kv = vercelKv;
  } catch {
    kv = null;
  }
}

type Subscriber = (event: { event: string; payload: any; ts?: number }) => void;
const localSubscribers = new Map<string, Set<Subscriber>>();

export async function broadcast(channel: string, event: string, payload: any) {
  const ts = Date.now();

  // In-process broadcast (local dev)
  if (useInProcess || !kv) {
    const subs = localSubscribers.get(channel);
    if (subs) {
      for (const sub of subs) {
        try {
          sub({ event, payload, ts });
        } catch {}
      }
    }
    return;
  }

  // Vercel KV (production)
  const eventKey = `evt:${channel}:${ts}:${Math.random().toString(36).slice(2)}`;
  await kv.set(eventKey, { event, payload, ts }, { ex: 30 });
}

export async function publishHeartbeat(userId: string, data: any) {
  if (useInProcess || !kv) {
    localSubscribers.set(`hb:${userId}`, new Set([(e) => {}]));
    return;
  }
  await kv.set(`hb:${userId}`, { ...data, lastHeartbeat: Date.now() }, { ex: 120 });
  await broadcast('admin-live', 'heartbeat', { userId, ...data, lastHeartbeat: Date.now() });
}

export async function getActiveUsers(): Promise<any[]> {
  if (useInProcess || !kv) return [];
  const keys = await kv.keys('hb:*');
  if (!keys.length) return [];
  const values = await Promise.all(keys.map((k) => kv.get(k)));
  return values.filter((v: any): v is any => v !== null);
}

export async function getActiveUserCount(): Promise<number> {
  if (useInProcess || !kv) return 0;
  const keys = await kv.keys('hb:*');
  return keys.length;
}

export async function clearHeartbeat(userId: string) {
  if (useInProcess || !kv) {
    localSubscribers.delete(`hb:${userId}`);
    return;
  }
  await kv.del(`hb:${userId}`);
  await broadcast('admin-live', 'disconnect', { userId });
}

export function makeChannel(...parts: (string | number)[]): string {
  return parts.map(String).join('-');
}

/**
 * Local SSE subscription (for the dev server).
 * In production, SSE handlers poll Vercel KV; in dev, we have direct access to the EventEmitter.
 */
export function subscribeLocal(channel: string, fn: Subscriber): () => void {
  if (!localSubscribers.has(channel)) localSubscribers.set(channel, new Set());
  localSubscribers.get(channel)!.add(fn);
  return () => {
    localSubscribers.get(channel)?.delete(fn);
  };
}

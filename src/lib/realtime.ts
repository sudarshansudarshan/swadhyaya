/**
 * Real-time broadcast via Vercel KV + Server-Sent Events.
 *
 * Channels:
 *   - admin-live: live presence (heartbeats from active users)
 *   - admin-activity: live activity feed
 *   - user-{userId}: per-user live drill-down
 *   - viva-{userId}: student viva status updates
 *   - viva-instructor-{instructorId}: instructor viva queue updates
 *   - course-{courseId}: course-wide changes (item updates, etc.)
 *   - item-{itemId}: per-item updates (activity swap, video change)
 */
import { kv } from '@vercel/kv';

const TTL = 60_000;

export async function broadcast(channel: string, event: string, payload: any) {
  const eventKey = `evt:${channel}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  await kv.set(eventKey, { event, payload, ts: Date.now() }, { ex: 30 });
}

export async function publishHeartbeat(userId: string, data: any) {
  await kv.set(`hb:${userId}`, { ...data, lastHeartbeat: Date.now() }, { ex: 120 });
  await broadcast('admin-live', 'heartbeat', { userId, ...data, lastHeartbeat: Date.now() });
}

export async function getActiveUsers(): Promise<any[]> {
  const keys = await kv.keys('hb:*');
  if (!keys.length) return [];
  const values = await Promise.all(keys.map((k) => kv.get(k)));
  return values.filter((v): v is any => v !== null);
}

export async function getActiveUserCount(): Promise<number> {
  const keys = await kv.keys('hb:*');
  return keys.length;
}

export async function clearHeartbeat(userId: string) {
  await kv.del(`hb:${userId}`);
  await broadcast('admin-live', 'disconnect', { userId });
}

export function makeChannel(...parts: (string | number)[]): string {
  return parts.map(String).join('-');
}

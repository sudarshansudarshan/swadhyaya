/**
 * SSE stream endpoint — listens to a Vercel KV channel and streams events to the client.
 *
 * Usage: GET /api/realtime/[channel]
 *
 * Note: Vercel Edge Runtime doesn't support long-lived connections in Hobby plan.
 * Use Node runtime (max 5min connection) or use Vercel Pro for longer.
 */
import { kv } from '@vercel/kv';
import { type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastSeenTs = Date.now();
      let closed = false;

      const sendEvent = (data: any) => {
        if (closed) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          closed = true;
        }
      };

      sendEvent({ type: 'connected', channel, ts: Date.now() });

      const interval = setInterval(async () => {
        if (closed) return;
        try {
          const keys = await kv.keys(`evt:${channel}:*`);
          const newKeys = keys.filter((k) => {
            const ts = parseInt(k.split(':')[2] ?? '0', 10);
            return ts > lastSeenTs;
          });

          for (const key of newKeys) {
            const evt = await kv.get(key);
            if (evt) {
              sendEvent(evt);
              const ts = (evt as any).ts ?? 0;
              if (ts > lastSeenTs) lastSeenTs = ts;
            }
            await kv.del(key);
          }

          controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
        } catch (err) {
          console.error('SSE error:', err);
        }
      }, 1000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      };

      req.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

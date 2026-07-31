import { kv } from '@vercel/kv';
import { type NextRequest } from 'next/server';
import { subscribeLocal } from '@/lib/realtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;
  const encoder = new TextEncoder();
  const useInProcess = process.env.USE_IN_PROCESS_PUBSUB === '1';

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let lastSeenTs = Date.now();

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

      // In-process subscription (local dev)
      if (useInProcess) {
        const unsub = subscribeLocal(channel, (evt) => {
          sendEvent(evt);
        });
        const ping = setInterval(() => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
          } catch {}
        }, 5000);
        req.signal.addEventListener('abort', () => {
          closed = true;
          unsub();
          clearInterval(ping);
          try {
            controller.close();
          } catch {}
        });
        return;
      }

      // Vercel KV (production)
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

      req.signal.addEventListener('abort', () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      });
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

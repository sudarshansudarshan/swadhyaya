'use client';

import { useState } from 'react';
import { useLiveChannel } from '@/hooks/useLiveChannel';

export function MuxVideoPlayer({
  muxPlaybackId,
  startTime = '00:00:00',
  endTime,
  poster,
  captionsUrl,
  onTimeUpdate,
  onEnded,
  onPaused,
  onPlayed,
  paused = false,
}: {
  muxPlaybackId: string;
  startTime?: string;
  endTime?: string;
  poster?: string;
  captionsUrl?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onPaused?: () => void;
  onPlayed?: () => void;
  paused?: boolean;
}) {
  const [ready, setReady] = useState(false);

  useLiveChannel(`mux-${muxPlaybackId}`);

  function parseTime(s: string): number {
    const parts = s.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] ?? 0;
  }

  const startSeconds = parseTime(startTime);
  const endSeconds = endTime ? parseTime(endTime) : undefined;

  if (!muxPlaybackId) {
    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center text-muted-foreground p-8">
          <div className="text-lg font-medium">No video uploaded</div>
          <p className="text-sm mt-2">The admin can add a video to this topic.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      <iframe
        src={`https://player.mux.com/${muxPlaybackId}.m3u8?metadata_video_title=Swadhyaya&poster=${encodeURIComponent(poster ?? '')}`}
        style={{ width: '100%', height: '100%', border: 0 }}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        onLoad={() => setReady(true)}
        title="Lesson video"
      />
    </div>
  );
}

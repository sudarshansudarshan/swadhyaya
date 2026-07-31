'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, Activity as ActivityIcon, ClipboardCheck, Save } from 'lucide-react';

type Section = {
  id: string;
  title: string;
  prompt: string;
  activityHtmlSlug: string;
  questionBankId: string;
};

type Item = {
  id: string;
  order: number;
  type: 'VIDEO' | 'ACTIVITY' | 'QUIZ';
  title: string;
  description: string | null;
  muxPlaybackId: string | null;
  videoStartTime: string | null;
  videoEndTime: string | null;
  videoMinWatchSeconds: number;
  activityHtmlSlug: string | null;
  activityMinSeconds: number;
  quizQuestionCount: number;
  quizPassThreshold: number;
  quizTimeLimit: number;
};

export function SectionEditor({
  section,
  items,
  availableSlugs,
}: {
  section: Section;
  items: Item[];
  availableSlugs: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(section.title);
  const [prompt, setPrompt] = useState(section.prompt);
  const [activitySlug, setActivitySlug] = useState(section.activityHtmlSlug);
  const [itemsState, setItemsState] = useState(items);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveSection() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, prompt, activityHtmlSlug: activitySlug }),
      });
      if (res.ok) {
        setMessage('Section saved.');
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(itemId: string, data: Partial<Item>) {
    const res = await fetch(`/api/admin/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setItemsState((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...data } : i)));
      setMessage('Item saved. Visible to students in 1-2 seconds.');
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          {message}
        </div>
      )}

      <div className="bg-white border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold">Section Details</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Default Activity HTML</label>
          <select
            value={activitySlug}
            onChange={(e) => setActivitySlug(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">— none —</option>
            {availableSlugs.map((s) => (
              <option key={s} value={s}>{s}.html</option>
            ))}
          </select>
        </div>
        <button
          onClick={saveSection}
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Section'}
        </button>
      </div>

      {itemsState.map((item) => (
        <ItemEditor key={item.id} item={item} availableSlugs={availableSlugs} onSave={(d) => updateItem(item.id, d)} />
      ))}
    </div>
  );
}

function ItemEditor({
  item,
  availableSlugs,
  onSave,
}: {
  item: Item;
  availableSlugs: string[];
  onSave: (data: Partial<Item>) => void;
}) {
  const [muxPlaybackId, setMuxPlaybackId] = useState(item.muxPlaybackId ?? '');
  const [videoStart, setVideoStart] = useState(item.videoStartTime ?? '00:00:00');
  const [videoEnd, setVideoEnd] = useState(item.videoEndTime ?? '');
  const [activitySlug, setActivitySlug] = useState(item.activityHtmlSlug ?? '');
  const [passThreshold, setPassThreshold] = useState(item.quizPassThreshold);
  const [timeLimit, setTimeLimit] = useState(item.quizTimeLimit);
  const [saving, setSaving] = useState(false);

  const Icon = item.type === 'VIDEO' ? Video : item.type === 'ACTIVITY' ? ActivityIcon : ClipboardCheck;
  const label = item.type === 'VIDEO' ? 'Video' : item.type === 'ACTIVITY' ? 'Activity' : 'Quiz';

  async function handleSave() {
    setSaving(true);
    try {
      const data: any = {};
      if (item.type === 'VIDEO') {
        data.muxPlaybackId = muxPlaybackId;
        data.videoStartTime = videoStart;
        data.videoEndTime = videoEnd || null;
      }
      if (item.type === 'ACTIVITY') {
        data.activityHtmlSlug = activitySlug;
      }
      if (item.type === 'QUIZ') {
        data.quizPassThreshold = passThreshold;
        data.quizTimeLimit = timeLimit;
      }
      await onSave(data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border rounded-xl p-6 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Icon className="h-4 w-4" /> {label}: {item.title}
      </h3>

      {item.type === 'VIDEO' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Mux Playback ID</label>
            <input
              value={muxPlaybackId}
              onChange={(e) => setMuxPlaybackId(e.target.value)}
              placeholder="paste Mux playback ID (e.g. abc123def456)"
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload video via /admin/items/video and Mux will provide this ID.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Start (HH:MM:SS)</label>
              <input
                value={videoStart}
                onChange={(e) => setVideoStart(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End (HH:MM:SS, optional)</label>
              <input
                value={videoEnd}
                onChange={(e) => setVideoEnd(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </>
      )}

      {item.type === 'ACTIVITY' && (
        <div>
          <label className="block text-sm font-medium mb-1">Activity HTML slug</label>
          <select
            value={activitySlug}
            onChange={(e) => setActivitySlug(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">— none —</option>
            {availableSlugs.map((s) => (
              <option key={s} value={s}>{s}.html</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Changes take effect immediately for the next student load.
          </p>
        </div>
      )}

      {item.type === 'QUIZ' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Pass threshold (out of 20)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={passThreshold}
              onChange={(e) => setPassThreshold(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time limit (sec, 0=none)</label>
            <input
              type="number"
              min={0}
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1 disabled:opacity-50"
      >
        <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

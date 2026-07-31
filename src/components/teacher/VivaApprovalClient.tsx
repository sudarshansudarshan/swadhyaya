'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Calendar, Video } from 'lucide-react';

type Props = {
  booking: any;
  progress: any[];
  moduleProgress: any[];
  quizAttempts: any[];
  proctorSessions: any[];
  videoWatches: any[];
};

export function VivaApprovalClient({ booking, progress, moduleProgress, quizAttempts, proctorSessions, videoWatches }: Props) {
  const router = useRouter();
  const [meetingUrl, setMeetingUrl] = useState(booking.slot.meetingsUrl ?? booking.meetingUrl ?? '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReject, setShowReject] = useState(false);

  async function handleApprove() {
    if (!meetingUrl) {
      alert('Please provide a meeting URL');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/viva/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, meetingUrl }),
      });
      if (res.ok) {
        router.push('/teacher/viva');
      } else {
        const data = await res.json();
        alert(data.error ?? 'Failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!reason || reason.length < 5) {
      alert('Please provide a reason (5+ characters)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/viva/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, reason }),
      });
      if (res.ok) {
        router.push('/teacher/viva');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Viva Review: {booking.user.name ?? booking.user.email}</h1>
        <p className="text-muted-foreground">Module {booking.module.number} · {booking.instructor}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm font-semibold mb-2">Slot</div>
          <div className="text-sm text-muted-foreground">
            <Calendar className="inline h-4 w-4 mr-1" />
            {new Date(booking.slot.startUtc).toLocaleString()} → {new Date(booking.slot.endUtc).toLocaleString()}
          </div>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm font-semibold mb-2">Status</div>
          <div className="text-sm">
            <span className={`px-2 py-0.5 rounded ${
              booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
              booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
              booking.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
              'bg-gray-100'
            }`}>
              {booking.status}
            </span>
          </div>
        </div>
      </div>

      {booking.status === 'PENDING' && (
        <div className="p-6 bg-white border rounded-xl space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Meeting URL</label>
            <input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.jit.si/your-room"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {!showReject ? (
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowReject(true)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" /> {submitting ? 'Approving…' : 'Approve & Send'}
              </button>
            </div>
          ) : (
            <div className="space-y-2 border-t pt-3">
              <label className="block text-sm font-medium">Rejection reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Explain why this viva is being declined…"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowReject(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Rejecting…' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm font-semibold mb-2">Module Progress</div>
          {moduleProgress.map((mp) => (
            <div key={mp.id} className="text-xs">
              Module {mp.moduleId.slice(-4)}: {mp.allItemsDone ? '✓ Complete' : 'In progress'}
            </div>
          ))}
          {moduleProgress.length === 0 && <div className="text-xs text-muted-foreground">No module progress yet.</div>}
        </div>

        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm font-semibold mb-2">Recent Quiz Attempts</div>
          {quizAttempts.slice(0, 5).map((a) => (
            <div key={a.id} className="text-xs flex justify-between py-0.5">
              <span>{a.itemId.slice(-6)}</span>
              <span>
                {a.score}/{a.total}{' '}
                <span className={a.passed ? 'text-emerald-600' : 'text-red-600'}>
                  {a.passed ? 'PASS' : 'FAIL'}
                </span>
              </span>
            </div>
          ))}
          {quizAttempts.length === 0 && <div className="text-xs text-muted-foreground">No attempts yet.</div>}
        </div>

        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm font-semibold mb-2">Recent Proctor Sessions</div>
          {proctorSessions.slice(0, 5).map((s) => (
            <div key={s.id} className="text-xs flex justify-between py-0.5">
              <span>{new Date(s.startedAt).toLocaleString()}</span>
              <span>
                penalty: {s.penaltyScore} {s.ejected && '· EJECTED'}
              </span>
            </div>
          ))}
          {proctorSessions.length === 0 && <div className="text-xs text-muted-foreground">None yet.</div>}
        </div>

        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm font-semibold mb-2">Video Watch Summary</div>
          {videoWatches.slice(0, 5).map((w) => (
            <div key={w.id} className="text-xs flex justify-between py-0.5">
              <span>{w.itemId.slice(-6)}</span>
              <span>{Math.floor((w.watchedSeconds ?? 0) / 60)}m · {w.completed ? '✓' : '·'}</span>
            </div>
          ))}
          {videoWatches.length === 0 && <div className="text-xs text-muted-foreground">None yet.</div>}
        </div>
      </div>
    </div>
  );
}

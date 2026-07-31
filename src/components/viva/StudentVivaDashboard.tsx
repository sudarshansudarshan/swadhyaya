'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';

type Module = { id: string; number: number; title: string | null; course: { title: string } };
type Booking = any;
type Slot = { id: string; moduleId: string; startUtc: string; endUtc: string; instructor: { name: string }; module: Module };
type Instructor = { id: string; name: string };

export function StudentVivaDashboard({
  completedModules,
  bookings,
  availableSlots,
  instructors,
}: {
  completedModules: Module[];
  bookings: Booking[];
  availableSlots: Slot[];
  instructors: Instructor[];
}) {
  const router = useRouter();
  const [moduleId, setModuleId] = useState<string>('');
  const [instructorId, setInstructorId] = useState<string>('');
  const [slotId, setSlotId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredSlots = availableSlots.filter(
    (s) => s.moduleId === moduleId && (!instructorId || s.instructor.name === instructors.find((i) => i.id === instructorId)?.name)
  );

  async function book() {
    if (!slotId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/viva/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error ?? 'Failed to book');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Viva Bookings</h1>

      {bookings.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Your bookings</h2>
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    Module {b.module?.number} · {b.status}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {b.slot ? new Date(b.slot.startUtc).toLocaleString() : '—'}
                  </div>
                  {b.meetingUrl && (
                    <a href={b.meetingUrl} target="_blank" className="text-sm text-emerald-600 underline mt-1 inline-block">
                      Join meeting
                    </a>
                  )}
                  {b.rejectionReason && (
                    <div className="text-sm text-red-600 mt-1">Reason: {b.rejectionReason}</div>
                  )}
                </div>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  b.status === 'CONFIRMED' ? 'bg-emerald-100' :
                  b.status === 'PENDING' ? 'bg-amber-100' :
                  b.status === 'CANCELLED' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {completedModules.length === 0 ? (
        <div className="p-8 bg-white border rounded-xl text-center text-muted-foreground">
          Complete all topics in a module to unlock viva booking.
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Book a new viva</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Module</label>
            <select
              value={moduleId}
              onChange={(e) => { setModuleId(e.target.value); setSlotId(''); }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">— select module —</option>
              {completedModules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.course.title} · Module {m.number}
                </option>
              ))}
            </select>
          </div>

          {moduleId && (
            <div>
              <label className="block text-sm font-medium mb-1">Instructor (optional)</label>
              <select
                value={instructorId}
                onChange={(e) => { setInstructorId(e.target.value); setSlotId(''); }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">— any —</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          )}

          {moduleId && filteredSlots.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Slot</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {filteredSlots.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSlotId(s.id)}
                    className={`p-3 border rounded-lg text-left ${
                      slotId === s.id ? 'border-emerald-500 bg-emerald-50' : 'hover:border-gray-400'
                    }`}
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm font-medium mt-1">{new Date(s.startUtc).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{s.instructor.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {moduleId && filteredSlots.length === 0 && (
            <p className="text-sm text-muted-foreground">No slots available for this module.</p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={book}
            disabled={!slotId || submitting}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Booking…' : 'Book Viva'}
          </button>
        </div>
      )}
    </div>
  );
}

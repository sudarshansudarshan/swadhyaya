'use client';

import { useState } from 'react';
import { useLiveChannel } from '@/hooks/useLiveChannel';
import { 
  Activity, Calendar, FileText, BarChart3, Video, Shield, BookOpen, 
  AlertCircle, Settings, ListChecks, MessageSquare, Download, FileText as FileTextIcon
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'timeline', label: 'Timeline', icon: ListChecks },
  { id: 'heatmap', label: 'Heat Map', icon: BarChart3 },
  { id: 'progress', label: 'Progress', icon: BookOpen },
  { id: 'quiz', label: 'Quiz', icon: FileText },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'proctor', label: 'Proctor', icon: Shield },
  { id: 'viva', label: 'Viva', icon: Calendar },
  { id: 'anomalies', label: 'Anomalies', icon: AlertCircle },
  { id: 'consent', label: 'Consent', icon: FileTextIcon },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'reset', label: 'Score Reset', icon: Settings },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
  { id: 'export', label: 'Export', icon: Download },
] as const;

export function UserDetail({ user }: { user: any }) {
  const [tab, setTab] = useState<typeof TABS[number]['id']>('overview');
  const [liveHeartbeat, setLiveHeartbeat] = useState<any>(null);
  const [newActivity, setNewActivity] = useState<any[]>([]);

  useLiveChannel(`user-${user.id}`, ({ event, payload }) => {
    if (event === 'heartbeat') setLiveHeartbeat(payload);
    if (event === 'activity') setNewActivity((prev) => [payload, ...prev].slice(0, 50));
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{user.name ?? user.email}</h1>
          <div className="text-sm text-muted-foreground">
            {user.email} · {user.role} · {user.cohort?.name ?? 'no cohort'}
          </div>
        </div>
        {liveHeartbeat && (
          <div className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full">
            🟢 Online · {liveHeartbeat.page}
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 px-3 py-2 text-sm border-b-2 ${
                tab === t.id ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-600'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white border rounded-xl p-6">
        {tab === 'overview' && <OverviewTab user={user} liveHeartbeat={liveHeartbeat} />}
        {tab === 'timeline' && <TimelineTab events={[...newActivity, ...user.activityLogs]} />}
        {tab === 'heatmap' && <HeatMapTab userId={user.id} />}
        {tab === 'progress' && <ProgressTab user={user} />}
        {tab === 'quiz' && <QuizTab attempts={user.quizAttempts} />}
        {tab === 'video' && <VideoTab watches={user.videoWatches} />}
        {tab === 'proctor' && <ProctorTab sessions={user.proctorSessions} />}
        {tab === 'viva' && <VivaTab bookings={user.vivaBookings} userId={user.id} />}
        {tab === 'anomalies' && <AnomaliesTab sessions={user.proctorSessions} />}
        {tab === 'consent' && <ConsentTab user={user} />}
        {tab === 'activity' && <ActivityTab logs={user.activityLogs} />}
        {tab === 'reset' && <ScoreResetTab user={user} />}
        {tab === 'notes' && <NotesTab user={user} />}
        {tab === 'export' && <ExportTab userId={user.id} />}
      </div>
    </div>
  );
}

function OverviewTab({ user, liveHeartbeat }: { user: any; liveHeartbeat: any }) {
  const completedProgress = user.progress?.filter((p: any) => p.completedAt).length ?? 0;
  const totalProgress = user.progress?.length ?? 0;
  const quizAttempts = user.quizAttempts?.length ?? 0;
  const proctorSessions = user.proctorSessions?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 border rounded-lg">
          <div className="text-xs text-muted-foreground">Items completed</div>
          <div className="text-2xl font-bold">{completedProgress}</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-xs text-muted-foreground">Quiz attempts</div>
          <div className="text-2xl font-bold">{quizAttempts}</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-xs text-muted-foreground">Proctor sessions</div>
          <div className="text-2xl font-bold">{proctorSessions}</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-xs text-muted-foreground">Vivas booked</div>
          <div className="text-2xl font-bold">{user.vivaBookings?.length ?? 0}</div>
        </div>
      </div>

      {liveHeartbeat && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="text-sm font-medium text-emerald-800">🟢 Currently Active</div>
          <div className="text-sm text-emerald-700 mt-1">
            Page: {liveHeartbeat.page}
            {liveHeartbeat.itemType && ` · ${liveHeartbeat.itemType}`}
            {liveHeartbeat.videoTimestamp && ` · video @ ${Math.floor(liveHeartbeat.videoTimestamp)}s`}
            {liveHeartbeat.quizQuestion && ` · Q${liveHeartbeat.quizQuestion} (${liveHeartbeat.quizScore})`}
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Joined {new Date(user.createdAt).toLocaleString()}
        {user.samagamaSub && ` · samagama: ${user.samagawaSub}`}
      </div>
    </div>
  );
}

function TimelineTab({ events }: { events: any[] }) {
  return (
    <div className="space-y-1 max-h-[600px] overflow-y-auto">
      {events.slice(0, 200).map((e, i) => (
        <div key={i} className="text-xs flex gap-2 py-1 border-b last:border-0">
          <span className="text-muted-foreground w-20">{new Date(e.createdAt).toLocaleTimeString()}</span>
          <span className="font-mono flex-1">{e.type}</span>
          <span className={`text-xs px-1.5 rounded ${e.severity === 'error' ? 'bg-red-100' : e.severity === 'warn' ? 'bg-amber-100' : 'bg-blue-100'}`}>
            {e.severity}
          </span>
        </div>
      ))}
      {events.length === 0 && <div className="text-muted-foreground text-sm">No events yet.</div>}
    </div>
  );
}

function HeatMapTab({ userId }: { userId: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Activity heat map (last 12 weeks)</p>
      <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-muted-foreground">
        Heat map visualization will be implemented with react-calendar-heatmap.
      </div>
    </div>
  );
}

function ProgressTab({ user }: { user: any }) {
  return (
    <div className="space-y-2 text-sm">
      {user.progress?.slice(0, 30).map((p: any) => (
        <div key={p.id} className="flex justify-between py-1 border-b">
          <span>{p.item?.title}</span>
          <span>
            {p.videoCompleted ? '✓ video' : '· video'} ·{' '}
            {p.activityCompleted ? '✓ activity' : '· activity'} ·{' '}
            {p.quizCompleted ? `✓ quiz ${p.quizScore}/${p.quizTotal}` : '· quiz'}
          </span>
        </div>
      ))}
    </div>
  );
}

function QuizTab({ attempts }: { attempts: any[] }) {
  return (
    <div className="space-y-1">
      {attempts.map((a) => (
        <div key={a.id} className="text-sm flex justify-between py-1 border-b">
          <span>{a.item?.title}</span>
          <span>
            {a.score}/{a.total}{' '}
            <span className={a.passed ? 'text-emerald-600' : 'text-red-600'}>
              {a.passed ? 'PASS' : 'FAIL'}
            </span>{' '}
            · {new Date(a.submittedAt).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function VideoTab({ watches }: { watches: any[] }) {
  return (
    <div className="space-y-1">
      {watches.map((w) => (
        <div key={w.id} className="text-sm flex justify-between py-1 border-b">
          <span>{w.item?.title}</span>
          <span>
            {Math.floor((w.watchedSeconds ?? 0) / 60)}m · rewinds: {w.rewinds} · FFs: {w.fastForwards} · {w.completed ? '✓' : '·'}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProctorTab({ sessions }: { sessions: any[] }) {
  return (
    <div className="space-y-1">
      {sessions.map((s) => (
        <div key={s.id} className="text-sm flex justify-between py-1 border-b">
          <span>{s.item?.title}</span>
          <span>
            flags: ? · penalty: {s.penaltyScore} · {s.ejected ? 'EJECTED' : 'OK'} · {new Date(s.startedAt).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function VivaTab({ bookings, userId }: { bookings: any[]; userId: string }) {
  return (
    <div className="space-y-1">
      {bookings.map((b) => (
        <div key={b.id} className="text-sm flex justify-between py-1 border-b">
          <span>Module {b.module?.number}</span>
          <span>
            {b.slot?.startUtc ? new Date(b.slot.startUtc).toLocaleString() : '—'} · {b.status}
            {b.meetingUrl && <> · <a href={b.meetingUrl} className="text-emerald-600 underline" target="_blank">join</a></>}
          </span>
        </div>
      ))}
    </div>
  );
}

function AnomaliesTab({ sessions }: { sessions: any[] }) {
  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      Anomaly breakdown will appear here. {sessions.length} proctor session(s) recorded.
    </div>
  );
}

function ConsentTab({ user }: { user: any }) {
  return (
    <div className="text-sm">
      <p>Ethics consent status: {user.ethicsConsents?.length > 0 ? 'Signed' : 'Not yet signed'}</p>
    </div>
  );
}

function ActivityTab({ logs }: { logs: any[] }) {
  return <TimelineTab events={logs} />;
}

function ScoreResetTab({ user }: { user: any }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Reset a student's score to force re-do. Use sparingly.
      </p>
      <div className="text-sm space-y-1">
        {user.scoreResets?.map((r: any) => (
          <div key={r.id} className="flex justify-between py-1 border-b">
            <span>{r.scope} · stages: {r.resetStages?.join(',')}</span>
            <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesTab({ user }: { user: any }) {
  return (
    <div className="space-y-2">
      {user.adminNotes?.map((n: any) => (
        <div key={n.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
          <div className="text-sm mt-1">{n.body}</div>
        </div>
      ))}
    </div>
  );
}

function ExportTab({ userId }: { userId: string }) {
  return (
    <div className="space-y-2 text-sm">
      <a href={`/api/admin/users/${userId}/export?format=csv`} className="block p-3 border rounded hover:bg-gray-50">
        📄 Download activity log (CSV)
      </a>
      <a href={`/api/admin/users/${userId}/export?format=quiz`} className="block p-3 border rounded hover:bg-gray-50">
        📄 Download quiz attempts (CSV)
      </a>
      <a href={`/api/admin/users/${userId}/export?format=video`} className="block p-3 border rounded hover:bg-gray-50">
        📄 Download video watches (CSV)
      </a>
    </div>
  );
}

/**
 * Activity log helper — every significant action is recorded here.
 * Broadcasts to admin-activity SSE channel for live feed.
 */
import { prisma } from './prisma';
import { broadcast } from './realtime';

export type ActivitySeverity = 'info' | 'warn' | 'error';

export type ActivityType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed'
  | 'consent.signed'
  | 'video.start'
  | 'video.stop'
  | 'video.heartbeat'
  | 'video.completed'
  | 'video.skipped'
  | 'activity.start'
  | 'activity.complete'
  | 'quiz.start'
  | 'quiz.answer'
  | 'quiz.submit'
  | 'quiz.pass'
  | 'quiz.fail'
  | 'proctor.session.start'
  | 'proctor.session.end'
  | 'proctor.event'
  | 'proctor.ejected'
  | 'proctor.restart'
  | 'viva.book'
  | 'viva.approve'
  | 'viva.reject'
  | 'viva.reschedule'
  | 'viva.share_link'
  | 'item.create'
  | 'item.update'
  | 'item.delete'
  | 'item.activity_swap'
  | 'question.create'
  | 'question.update'
  | 'question.delete'
  | 'question.import'
  | 'instructor.create'
  | 'instructor.update'
  | 'instructor.permission_change'
  | 'instructor.module_assign'
  | 'module_progress.complete'
  | 'module_progress.viva_unlocked'
  | 'score.reset'
  | 'question.invalidated'
  | 'user.viewed';

export async function logActivity(params: {
  type: ActivityType;
  severity?: ActivitySeverity;
  actorId?: string;
  actorRole?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SYSTEM';
  userId?: string;
  instructorId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { type, severity = 'info', ...rest } = params;

  try {
    const log = await prisma.activityLog.create({
      data: {
        type,
        severity,
        ...rest,
      },
    });

    await broadcast('admin-activity', 'log', {
      id: log.id,
      type,
      severity,
      ...rest,
      createdAt: log.createdAt.toISOString(),
    });

    if (rest.userId) {
      await broadcast(`user-${rest.userId}`, 'activity', {
        type, severity, ...rest, createdAt: log.createdAt.toISOString(),
      });
    }
  } catch (err) {
    console.error('logActivity failed:', err);
  }
}

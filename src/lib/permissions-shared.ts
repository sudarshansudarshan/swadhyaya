/**
 * Shared permission types — re-exported for client components.
 */
export type Permission =
  | 'viva.view_pending'
  | 'viva.approve'
  | 'viva.reject'
  | 'viva.reschedule'
  | 'viva.manage_slots'
  | 'viva.share_meeting_link'
  | 'students.view_progress'
  | 'students.view_watch_time'
  | 'students.view_quiz_scores'
  | 'students.view_emotion'
  | 'students.view_proctor'
  | 'students.view_anomalies'
  | 'students.view_reset_history'
  | 'students.reset_score'
  | 'students.cancel_question'
  | 'students.reinvalidate_quiz'
  | 'students.export_csv'
  | 'content.view_items'
  | 'content.edit_items'
  | 'content.view_questions'
  | 'content.edit_questions'
  | 'analytics.view_module'
  | 'analytics.view_course'
  | 'analytics.export_csv';

export type StaffRole = 'LEAD_INSTRUCTOR' | 'TEACHING_ASSISTANT' | 'ADMIN';

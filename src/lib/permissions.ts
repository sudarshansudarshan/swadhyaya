/**
 * Permission keys for granular RBAC.
 * Each permission can be toggled per-instructor via the admin UI.
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

export const ALL_PERMISSIONS: Permission[] = [
  'viva.view_pending',
  'viva.approve',
  'viva.reject',
  'viva.reschedule',
  'viva.manage_slots',
  'viva.share_meeting_link',
  'students.view_progress',
  'students.view_watch_time',
  'students.view_quiz_scores',
  'students.view_emotion',
  'students.view_proctor',
  'students.view_anomalies',
  'students.view_reset_history',
  'students.reset_score',
  'students.cancel_question',
  'students.reinvalidate_quiz',
  'students.export_csv',
  'content.view_items',
  'content.edit_items',
  'content.view_questions',
  'content.edit_questions',
  'analytics.view_module',
  'analytics.view_course',
  'analytics.export_csv',
];

export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  Viva: [
    'viva.view_pending',
    'viva.approve',
    'viva.reject',
    'viva.reschedule',
    'viva.manage_slots',
    'viva.share_meeting_link',
  ],
  Students: [
    'students.view_progress',
    'students.view_watch_time',
    'students.view_quiz_scores',
    'students.view_emotion',
    'students.view_proctor',
    'students.view_anomalies',
    'students.view_reset_history',
    'students.reset_score',
    'students.cancel_question',
    'students.reinvalidate_quiz',
    'students.export_csv',
  ],
  Content: [
    'content.view_items',
    'content.edit_items',
    'content.view_questions',
    'content.edit_questions',
  ],
  Analytics: [
    'analytics.view_module',
    'analytics.view_course',
    'analytics.export_csv',
  ],
};

export const PRESETS: Record<string, Permission[]> = {
  lead: [
    'viva.view_pending',
    'viva.approve',
    'viva.reject',
    'viva.reschedule',
    'viva.manage_slots',
    'viva.share_meeting_link',
    'students.view_progress',
    'students.view_watch_time',
    'students.view_quiz_scores',
    'students.view_emotion',
    'students.view_proctor',
    'students.view_anomalies',
    'students.view_reset_history',
    'students.reset_score',
    'students.cancel_question',
    'students.reinvalidate_quiz',
    'content.view_items',
    'content.edit_items',
    'content.view_questions',
    'content.edit_questions',
    'analytics.view_module',
  ],
  ta: [
    'viva.view_pending',
    'viva.approve',
    'viva.reject',
    'viva.share_meeting_link',
    'students.view_progress',
    'students.view_watch_time',
    'students.view_quiz_scores',
    'students.view_emotion',
    'students.view_proctor',
    'students.view_anomalies',
    'students.view_reset_history',
    'students.cancel_question',
    'content.view_items',
    'content.view_questions',
    'analytics.view_module',
  ],
  reviewer: [
    'students.view_progress',
    'students.view_watch_time',
    'students.view_quiz_scores',
    'students.view_emotion',
    'students.view_proctor',
    'students.view_anomalies',
    'students.view_reset_history',
    'content.view_items',
    'content.view_questions',
    'analytics.view_module',
  ],
  viva_only: [
    'viva.view_pending',
    'viva.approve',
    'viva.reject',
    'viva.reschedule',
    'viva.share_meeting_link',
    'students.view_progress',
    'students.view_quiz_scores',
    'students.view_proctor',
  ],
};

export const PRESET_DESCRIPTIONS: Record<string, string> = {
  lead: 'Lead Instructor — full content edit + viva approval + score control',
  ta: 'Teaching Assistant — approve viva + view student details',
  reviewer: 'Reviewer — read-only access to student progress',
  viva_only: 'Viva-only — approve/reject viva + minimal student context',
};

export type ProctorEventType =
  | 'tab_switch'
  | 'tab_blur'
  | 'no_face'
  | 'multiple_faces'
  | 'blur_detected'
  | 'motion_detected'
  | 'voice_detected'
  | 'virtual_camera'
  | 'right_click'
  | 'copy_paste'
  | 'devtools'
  | 'idle'
  | 'camera_covered'
  | 'camera_overexposed'
  | 'face_mismatch'
  | 'ejected';

export type ProctorAnomaly = {
  id: number;
  timestamp: number;
  type: ProctorEventType;
  severity: number;
  screenshot?: string | null;
  metadata?: Record<string, unknown>;
};

export type ProctorSessionPayload = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  itemId: string;
  penaltyScore: number;
  ejected: boolean;
};

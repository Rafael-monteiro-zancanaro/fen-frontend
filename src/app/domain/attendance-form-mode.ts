export const ATTENDANCE_FORM_MODES = {
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  FOLLOW_UP_RETURN: 'FOLLOW_UP_RETURN',
} as const;

export type AttendanceFormMode = (typeof ATTENDANCE_FORM_MODES)[keyof typeof ATTENDANCE_FORM_MODES];

// Application constants

// Letter Nature options
export const LETTER_NATURE = {
  BIASA: 'BIASA',
  TERBATAS: 'TERBATAS',
  RAHASIA: 'RAHASIA',
  SANGAT_RAHASIA: 'SANGAT_RAHASIA',
  PENTING: 'PENTING',
} as const;

// Security Classification options
export const SECURITY_CLASS = {
  BIASA: 'BIASA',
  TERBATAS: 'TERBATAS',
} as const;

// Processing Method options
export const PROCESSING_METHOD = {
  MANUAL: 'MANUAL',
  SRIKANDI: 'SRIKANDI',
} as const;

// Disposition Target options
export const DISPOSITION_TARGET = {
  UMPEG: 'UMPEG',
  PERENCANAAN: 'PERENCANAAN',
  KAUR_KEUANGAN: 'KAUR_KEUANGAN',
  KABID: 'KABID',
  BIDANG1: 'BIDANG1',
  BIDANG2: 'BIDANG2',
  BIDANG3: 'BIDANG3',
  BIDANG4: 'BIDANG4',
  BIDANG5: 'BIDANG5',
} as const;

// Notification Type options
export const NOTIFICATION_TYPE = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
} as const;

// Event Type options
export const EVENT_TYPE = {
  MEETING: 'MEETING',
  APPOINTMENT: 'APPOINTMENT',
  DEADLINE: 'DEADLINE',
  OTHER: 'OTHER',
} as const;

// User Role options
export const USER_ROLE = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// File upload settings
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
} as const;

// Rate limiting settings
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  LOGIN_MAX_REQUESTS: 5,
} as const;

// Notification reminder days
export const NOTIFICATION_DAYS = {
  SEVEN_DAYS: 7,
  THREE_DAYS: 3,
  ONE_DAY: 1,
} as const;

// Disposition target labels (for display)
export const DISPOSITION_TARGET_LABELS: Record<string, string> = {
  UMPEG: 'UMPEG',
  PERENCANAAN: 'Perencanaan',
  KAUR_KEUANGAN: 'Kaur Keuangan',
  KABID: 'Kabid',
  BIDANG1: 'Bidang 1',
  BIDANG2: 'Bidang 2',
  BIDANG3: 'Bidang 3',
  BIDANG4: 'Bidang 4',
  BIDANG5: 'Bidang 5',
};

// Letter nature labels (for display)
export const LETTER_NATURE_LABELS: Record<string, string> = {
  BIASA: 'Biasa',
  TERBATAS: 'Terbatas',
  RAHASIA: 'Rahasia',
  SANGAT_RAHASIA: 'Sangat Rahasia',
  PENTING: 'Penting',
};

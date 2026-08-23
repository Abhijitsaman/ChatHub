export const APP_NAME = 'ChatHub';
export const APP_VERSION = '1.0.0';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export const DISPLAY_NAME_MAX_LENGTH = 50;
export const BIO_MAX_LENGTH = 150;

export const MESSAGE_PAGE_SIZE = 30;
export const SEARCH_RESULT_LIMIT = 20;

export const CALL_TIMEOUT_MS = 30000; // 30 seconds
export const TYPING_DEBOUNCE_MS = 500;
export const SEARCH_DEBOUNCE_MS = 500;

export const ROUTES = {
  LOGIN: '/login',
  ONBOARDING: '/onboarding',
  CHATS: '/chats',
  CHAT: '/chat/:conversationId',
  SEARCH: '/search',
  PROFILE: '/profile',
  PROFILE_USER: '/profile/:username',
  SETTINGS: '/settings',
  QR: '/qr',
  SCAN: '/scan',
  CALL: '/call/:callId',
};

export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  SEEN: 'seen',
  DELETED: 'deleted',
};

export const CALL_TYPES = {
  VOICE: 'voice',
  VIDEO: 'video',
};

export const CALL_STATUS = {
  CALLING: 'calling',
  CONNECTED: 'connected',
  REJECTED: 'rejected',
  ENDED: 'ended',
  FAILED: 'failed',
};

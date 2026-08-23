import { USERNAME_REGEX, USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH } from '../constants';

export const isValidUsername = (username) => {
  if (!username) return false;
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return false;
  }
  return USERNAME_REGEX.test(username);
};

export const isValidDisplayName = (name) => {
  if (!name) return false;
  return name.trim().length > 0 && name.trim().length <= 50;
};

export const isValidBio = (bio) => {
  if (!bio) return true;
  return bio.length <= 150;
};

export const isValidMessage = (text) => {
  if (!text) return false;
  return text.trim().length > 0 && text.trim().length <= 5000;
};

export const isUrlSafe = (url) => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const sanitizeText = (text) => {
  if (!text) return '';
  // Remove potential XSS vectors
  return text
    .replace(/[<>]/g, '')
    .trim();
};

export const validateSearchQuery = (query) => {
  if (!query) return 'Search query is required';
  if (query.length < 1) return 'Search query must be at least 1 character';
  if (query.length > 50) return 'Search query must be at most 50 characters';
  return null;
};

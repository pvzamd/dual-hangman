import { MAX_CHAT_LENGTH } from './constants.js';

/**
 * Normalizes a chat message: trims surrounding whitespace, drops empty
 * messages, and caps the length. Returns the cleaned text, or null if there is
 * nothing worth sending. Shared so client and server validate identically.
 */
export function normalizeChatText(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (text.length === 0) return null;
  return text.slice(0, MAX_CHAT_LENGTH);
}

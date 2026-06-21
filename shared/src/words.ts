import { MAX_WORD_LENGTH, MIN_WORD_LENGTH, VALID_WORD_PATTERN } from './constants.js';

/**
 * Normalizes a candidate secret word: trims and uppercases, then validates
 * length and charset. Returns the normalized word, or null if invalid.
 * Single source of validation — the client uses it for inline feedback,
 * the server as the authoritative check.
 */
export function normalizeSecretWord(raw: string): string | null {
  const word = raw.trim().toUpperCase();
  if (word.length < MIN_WORD_LENGTH || word.length > MAX_WORD_LENGTH) return null;
  if (!VALID_WORD_PATTERN.test(word)) return null;
  return word;
}

// Wrong guesses carry no gameplay penalty (ADR-009) — there is deliberately
// no MAX_WRONG_GUESSES constant. The hangman figure is a cosmetic loss visual.

export const MIN_WORD_LENGTH = 3;
export const MAX_WORD_LENGTH = 12;

/** Player display name length bounds (after trimming). */
export const MAX_PLAYER_NAME_LENGTH = 20;

/** Secret words and guesses must match this after uppercasing. */
export const VALID_WORD_PATTERN = /^[A-Z]+$/;
export const VALID_LETTER_PATTERN = /^[A-Z]$/;

export const ROOM_CODE_LENGTH = 5;
/** Unambiguous charset for room codes (no 0/O, 1/I/L). */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Seconds a disconnected player may reconnect before forfeiting. */
export const RECONNECT_GRACE_SECONDS = 60;

/** Minutes of room inactivity before the server reclaims it. */
export const ROOM_IDLE_TIMEOUT_MINUTES = 30;

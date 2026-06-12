import type { PlayerId } from '@dual-hangman/shared';

const STORAGE_KEY = 'dual-hangman:identity';

/**
 * Credentials persisted across page refreshes so a player can rejoin
 * their room (ADR-007). Cleared on explicit leave or rejected reconnect.
 */
export interface StoredIdentity {
  roomCode: string;
  playerId: PlayerId;
  reconnectToken: string;
  playerName: string;
}

export function saveIdentity(identity: StoredIdentity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function loadIdentity(): StoredIdentity | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isStoredIdentity(parsed)) return parsed;
  } catch {
    // corrupted JSON — fall through and clear
  }
  clearIdentity();
  return null;
}

export function clearIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function isStoredIdentity(value: unknown): value is StoredIdentity {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.roomCode === 'string' &&
    typeof candidate.playerId === 'string' &&
    typeof candidate.reconnectToken === 'string' &&
    typeof candidate.playerName === 'string'
  );
}

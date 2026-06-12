import { randomBytes, randomUUID } from 'node:crypto';
import {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  type PlayerId,
  type RoomPhase,
} from '@dual-hangman/shared';
import { GameManager } from '../game/GameManager.js';

/**
 * Authoritative server-side player record. Unlike the shared PlayerInfo,
 * this holds secrets (reconnectToken, secretWord) that must never be sent
 * to the opponent.
 */
export interface ServerPlayer {
  id: PlayerId;
  name: string;
  socketId: string | null;
  reconnectToken: string;
  connected: boolean;
  secretWord: string | null;
}

export interface Room {
  code: string;
  phase: RoomPhase;
  players: ServerPlayer[];
  game: GameManager | null;
  createdAt: number;
  lastActivityAt: number;
}

/**
 * Owns the in-memory map of active rooms. Skeleton for Phase 2 —
 * room creation/join wiring to socket handlers is not done yet.
 * No database: rooms die with the process (see docs/DECISIONS.md ADR-002).
 */
export class RoomManager {
  private readonly rooms = new Map<string, Room>();

  createRoom(hostName: string): Room {
    const room: Room = {
      code: this.generateUniqueCode(),
      phase: 'waiting_for_opponent',
      players: [createPlayer(hostName)],
      game: null,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };
    this.rooms.set(room.code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  removeRoom(code: string): void {
    this.rooms.delete(code.toUpperCase());
  }

  // TODO Phase 2: joinRoom(code, playerName) — validate phase + capacity,
  //   append player, transition to word_setup.
  // TODO Phase 6: sweepIdleRooms() on an interval using
  //   ROOM_IDLE_TIMEOUT_MINUTES and lastActivityAt.

  private generateUniqueCode(): string {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.rooms.has(code));
    return code;
  }
}

function createPlayer(name: string): ServerPlayer {
  return {
    id: randomUUID(),
    name,
    socketId: null,
    reconnectToken: randomBytes(24).toString('base64url'),
    connected: true,
    secretWord: null,
  };
}

function generateRoomCode(): string {
  const bytes = randomBytes(ROOM_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[bytes[i] % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

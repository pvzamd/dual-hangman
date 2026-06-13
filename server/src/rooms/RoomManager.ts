import { randomBytes, randomUUID } from 'node:crypto';
import {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  type PlayerId,
  type RoomPhase,
} from '@dual-hangman/shared';
import type { GameManager } from '../game/GameManager.js';

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

export type JoinFailure = 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'INVALID_PHASE';

export type JoinResult =
  | { ok: true; room: Room; player: ServerPlayer }
  | { ok: false; error: JoinFailure };

export type LeaveResult =
  | { destroyed: true }
  | { destroyed: false; room: Room; remaining: ServerPlayer };

export interface ForfeitResult {
  room: Room;
  winner: ServerPlayer;
  forfeiterId: PlayerId;
}

/**
 * Owns the in-memory map of active rooms and the reconnection grace timers.
 * No database: rooms die with the process (ADR-002). All methods are
 * synchronous; socket emission is the handler layer's job.
 */
export class RoomManager {
  private readonly rooms = new Map<string, Room>();
  private readonly graceTimers = new Map<string, ReturnType<typeof setTimeout>>();

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

  joinRoom(code: string, playerName: string): JoinResult {
    const room = this.getRoom(code);
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    if (room.players.length >= 2) return { ok: false, error: 'ROOM_FULL' };
    if (room.phase !== 'waiting_for_opponent') return { ok: false, error: 'INVALID_PHASE' };

    const player = createPlayer(playerName);
    room.players.push(player);
    room.phase = 'word_setup';
    room.lastActivityAt = Date.now();
    return { ok: true, room, player };
  }

  /**
   * Removes a player (explicit leave or expired grace timer).
   * Last player out destroys the room; otherwise the room reverts to
   * waiting_for_opponent so the remaining player can share the code again.
   * TODO Phase 4: leaving mid-`playing` must forfeit (game_won) instead.
   */
  leaveRoom(code: string, playerId: PlayerId): LeaveResult | null {
    const room = this.getRoom(code);
    if (!room) return null;
    const index = room.players.findIndex((p) => p.id === playerId);
    if (index === -1) return null;

    this.cancelGraceTimer(code, playerId);
    room.players.splice(index, 1);

    if (room.players.length === 0) {
      this.removeRoom(code);
      return { destroyed: true };
    }

    const remaining = room.players[0];
    room.phase = 'waiting_for_opponent';
    remaining.secretWord = null;
    room.game = null;
    room.lastActivityAt = Date.now();
    return { destroyed: false, room, remaining };
  }

  /**
   * Ends an in-progress round because a player left or timed out: the other
   * player wins by forfeit. Only valid during `playing` (returns null
   * otherwise, so lobby-phase exits keep their revert/destroy behavior).
   * The forfeiter stays in `players` — marked disconnected — so the winner's
   * GameView still renders both boards; the room transitions to `game_over`.
   */
  forfeit(code: string, playerId: PlayerId): ForfeitResult | null {
    const room = this.getRoom(code);
    if (!room || !room.game || room.phase !== 'playing') return null;
    const forfeiter = room.players.find((p) => p.id === playerId);
    if (!forfeiter) return null;

    this.cancelGraceTimer(code, playerId);
    room.game.forfeit(playerId);
    room.phase = 'game_over';
    forfeiter.connected = false;
    forfeiter.socketId = null;
    room.lastActivityAt = Date.now();

    const winner = room.players.find((p) => p.id === room.game!.winnerId);
    if (!winner) return null; // unreachable: the winner is the other seated player
    return { room, winner, forfeiterId: playerId };
  }

  validateReconnect(
    code: string,
    playerId: PlayerId,
    reconnectToken: string,
  ): { room: Room; player: ServerPlayer } | null {
    const room = this.getRoom(code);
    if (!room) return null;
    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.reconnectToken !== reconnectToken) return null;
    room.lastActivityAt = Date.now();
    return { room, player };
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getPlayer(room: Room, playerId: PlayerId): ServerPlayer | undefined {
    return room.players.find((p) => p.id === playerId);
  }

  getOpponent(room: Room, playerId: PlayerId): ServerPlayer | undefined {
    return room.players.find((p) => p.id !== playerId);
  }

  removeRoom(code: string): void {
    const upper = code.toUpperCase();
    for (const key of this.graceTimers.keys()) {
      if (key.startsWith(`${upper}:`)) {
        clearTimeout(this.graceTimers.get(key));
        this.graceTimers.delete(key);
      }
    }
    this.rooms.delete(upper);
  }

  startGraceTimer(code: string, playerId: PlayerId, seconds: number, onExpire: () => void): void {
    const key = timerKey(code, playerId);
    clearTimeout(this.graceTimers.get(key));
    this.graceTimers.set(
      key,
      setTimeout(() => {
        this.graceTimers.delete(key);
        onExpire();
      }, seconds * 1000),
    );
  }

  cancelGraceTimer(code: string, playerId: PlayerId): void {
    const key = timerKey(code, playerId);
    clearTimeout(this.graceTimers.get(key));
    this.graceTimers.delete(key);
  }

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

function timerKey(code: string, playerId: PlayerId): string {
  return `${code.toUpperCase()}:${playerId}`;
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

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
  /** Set at game_over when this player opts into a rematch (cleared on reset). */
  wantsRematch: boolean;
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

export type RematchOutcome =
  /** Not in a state where a rematch can be requested. */
  | { type: 'invalid' }
  /** This player opted in; the opponent has been notified and must opt in too. */
  | { type: 'requested'; opponent: ServerPlayer }
  /** Both players opted in; the room has been reset to word_setup. */
  | { type: 'started'; room: Room }
  /** The opponent has left, so no rematch is possible. */
  | { type: 'unavailable'; opponent: ServerPlayer };

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
   * Removes a player (explicit leave or expired grace timer) outside an active
   * round. Last player out destroys the room; otherwise it reverts to
   * waiting_for_opponent so the remaining player can share the code again.
   * (Leaving during `playing` is a forfeit — see `forfeit`, decided upstream.)
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
    remaining.wantsRematch = false;
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

  /**
   * Records a rematch opt-in after a finished game (mutual opt-in, like word
   * submission). Both opted in → the room is reset to word_setup. Opponent
   * absent → unavailable. Only valid at `game_over`.
   */
  requestRematch(code: string, playerId: PlayerId): RematchOutcome {
    const room = this.getRoom(code);
    if (!room || room.phase !== 'game_over') return { type: 'invalid' };
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { type: 'invalid' };

    const opponent = room.players.find((p) => p.id !== playerId);
    if (!opponent || !opponent.connected) {
      return opponent ? { type: 'unavailable', opponent } : { type: 'invalid' };
    }

    player.wantsRematch = true;
    room.lastActivityAt = Date.now();

    if (opponent.wantsRematch) {
      this.resetForRematch(room);
      return { type: 'started', room };
    }
    return { type: 'requested', opponent };
  }

  /** Clears words/flags and returns the room to word_setup for a new round. */
  resetForRematch(room: Room): void {
    for (const player of room.players) {
      player.secretWord = null;
      player.wantsRematch = false;
    }
    room.game = null;
    room.phase = 'word_setup';
    room.lastActivityAt = Date.now();
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
    wantsRematch: false,
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

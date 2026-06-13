import { describe, expect, it } from 'vitest';
import { ROOM_CODE_LENGTH, ROOM_IDLE_TIMEOUT_MINUTES } from '@dual-hangman/shared';
import { GameManager } from '../game/GameManager.js';
import { RoomManager } from './RoomManager.js';

/** A room driven into the `playing` phase with a live game, as the handler does. */
function playingRoom() {
  const manager = new RoomManager();
  const room = manager.createRoom('Alice');
  const join = manager.joinRoom(room.code, 'Bob');
  if (!join.ok) throw new Error('join failed');
  const host = room.players[0];
  const joiner = join.player;
  host.secretWord = 'PUZZLE';
  joiner.secretWord = 'BOOK';
  room.game = new GameManager(
    { playerId: host.id, secretWord: host.secretWord },
    { playerId: joiner.id, secretWord: joiner.secretWord },
  );
  room.phase = 'playing';
  return { manager, room, host, joiner };
}

/** A finished room (both players present, normal word_solved win). */
function gameOverRoom() {
  const ctx = playingRoom();
  const winner = ctx.room.game!.activePlayerId;
  const target = ctx.room.game!.targetWordFor(winner);
  for (const letter of new Set(target.split(''))) ctx.room.game!.guessLetter(winner, letter);
  ctx.room.phase = 'game_over';
  return ctx;
}

describe('RoomManager', () => {
  describe('createRoom', () => {
    it('creates a waiting room with one connected host', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');

      expect(room.code).toHaveLength(ROOM_CODE_LENGTH);
      expect(room.phase).toBe('waiting_for_opponent');
      expect(room.players).toHaveLength(1);
      expect(room.players[0].name).toBe('Alice');
      expect(room.players[0].reconnectToken).toBeTruthy();
      expect(room.game).toBeNull();
    });

    it('generates unique codes across many rooms', () => {
      const manager = new RoomManager();
      const codes = new Set(Array.from({ length: 200 }, () => manager.createRoom('P').code));
      expect(codes.size).toBe(200);
    });

    it('finds rooms case-insensitively', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');
      expect(manager.getRoom(room.code.toLowerCase())).toBe(room);
    });
  });

  describe('joinRoom', () => {
    it('adds the second player and advances to word_setup', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');
      const result = manager.joinRoom(room.code, 'Bob');

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.room.players).toHaveLength(2);
      expect(result.room.phase).toBe('word_setup');
      expect(result.player.name).toBe('Bob');
      expect(result.player.id).not.toBe(room.players[0].id);
    });

    it('rejects an unknown room code', () => {
      const manager = new RoomManager();
      expect(manager.joinRoom('ZZZZZ', 'Bob')).toEqual({ ok: false, error: 'ROOM_NOT_FOUND' });
    });

    it('rejects a full room', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');
      manager.joinRoom(room.code, 'Bob');
      expect(manager.joinRoom(room.code, 'Carol')).toEqual({ ok: false, error: 'ROOM_FULL' });
    });

    it('rejects a room that is past the waiting phase', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');
      room.phase = 'playing';
      expect(manager.joinRoom(room.code, 'Bob')).toEqual({ ok: false, error: 'INVALID_PHASE' });
    });
  });

  describe('leaveRoom', () => {
    it('destroys the room when the last player leaves', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');
      const result = manager.leaveRoom(room.code, room.players[0].id);

      expect(result).toEqual({ destroyed: true });
      expect(manager.getRoom(room.code)).toBeUndefined();
    });

    it('reverts a two-player room to waiting_for_opponent', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');
      const join = manager.joinRoom(room.code, 'Bob');
      if (!join.ok) throw new Error('join failed');

      const result = manager.leaveRoom(room.code, join.player.id);
      expect(result).not.toBeNull();
      if (!result || result.destroyed) throw new Error('expected revert');
      expect(result.room.phase).toBe('waiting_for_opponent');
      expect(result.remaining.name).toBe('Alice');
      expect(result.room.players).toHaveLength(1);
    });

    it('returns null for an unknown player or room', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');
      expect(manager.leaveRoom(room.code, 'not-a-player')).toBeNull();
      expect(manager.leaveRoom('ZZZZZ', room.players[0].id)).toBeNull();
    });
  });

  describe('validateReconnect', () => {
    it('accepts matching credentials', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');
      const host = room.players[0];

      const hit = manager.validateReconnect(room.code, host.id, host.reconnectToken);
      expect(hit?.player).toBe(host);
      expect(hit?.room).toBe(room);
    });

    it('rejects a wrong token, wrong player, or wrong room', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');
      const host = room.players[0];

      expect(manager.validateReconnect(room.code, host.id, 'bad-token')).toBeNull();
      expect(manager.validateReconnect(room.code, 'bad-id', host.reconnectToken)).toBeNull();
      expect(manager.validateReconnect('ZZZZZ', host.id, host.reconnectToken)).toBeNull();
    });
  });

  describe('forfeit', () => {
    it('during playing, the opponent wins by opponent_forfeit and the room ends in game_over', () => {
      const { manager, room, host, joiner } = playingRoom();

      const result = manager.forfeit(room.code, host.id);

      expect(result).not.toBeNull();
      if (!result) return;
      expect(result.winner.id).toBe(joiner.id);
      expect(result.forfeiterId).toBe(host.id);
      expect(room.phase).toBe('game_over');
      expect(room.game?.winnerId).toBe(joiner.id);
      expect(room.game?.gameOverReason).toBe('opponent_forfeit');
    });

    it('keeps both players (forfeiter marked disconnected) and does not destroy the room', () => {
      const { manager, room, host } = playingRoom();

      manager.forfeit(room.code, host.id);

      expect(room.players).toHaveLength(2); // winner's view still renders both boards
      expect(host.connected).toBe(false);
      expect(host.socketId).toBeNull();
      expect(manager.getRoom(room.code)).toBe(room);
    });

    it('forfeits whoever leaves — the player on turn or the player waiting', () => {
      const { manager, room } = playingRoom();
      const active = room.game!.activePlayerId;
      const expectedWinner = room.players.find((p) => p.id !== active)!.id;

      const result = manager.forfeit(room.code, active);
      expect(result?.winner.id).toBe(expectedWinner);
    });

    it('returns null outside the playing phase (waiting / word_setup)', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');
      expect(manager.forfeit(room.code, room.players[0].id)).toBeNull(); // waiting_for_opponent

      manager.joinRoom(room.code, 'Bob');
      expect(room.phase).toBe('word_setup');
      expect(manager.forfeit(room.code, room.players[0].id)).toBeNull();
    });

    it('returns null for an unknown room or player', () => {
      const { manager, room } = playingRoom();
      expect(manager.forfeit('ZZZZZ', room.players[0].id)).toBeNull();
      expect(manager.forfeit(room.code, 'not-a-player')).toBeNull();
    });
  });

  describe('requestRematch', () => {
    it('a single request records the opt-in and waits for the opponent', () => {
      const { manager, room, host, joiner } = gameOverRoom();

      const outcome = manager.requestRematch(room.code, host.id);

      expect(outcome.type).toBe('requested');
      if (outcome.type !== 'requested') return;
      expect(outcome.opponent.id).toBe(joiner.id);
      expect(host.wantsRematch).toBe(true);
      expect(room.phase).toBe('game_over'); // not reset until both opt in
    });

    it('when both opt in, the room resets to a fresh word_setup round', () => {
      const { manager, room, host, joiner } = gameOverRoom();
      host.secretWord = 'PUZZLE';
      joiner.secretWord = 'BOOK';

      manager.requestRematch(room.code, host.id);
      const outcome = manager.requestRematch(room.code, joiner.id);

      expect(outcome.type).toBe('started');
      expect(room.phase).toBe('word_setup');
      expect(room.game).toBeNull();
      expect(room.players.every((p) => p.secretWord === null)).toBe(true);
      expect(room.players.every((p) => p.wantsRematch === false)).toBe(true);
      expect(room.players).toHaveLength(2);
    });

    it('is unavailable when the opponent has disconnected', () => {
      const { manager, room, host, joiner } = gameOverRoom();
      joiner.connected = false;

      const outcome = manager.requestRematch(room.code, host.id);
      expect(outcome.type).toBe('unavailable');
      if (outcome.type !== 'unavailable') return;
      expect(outcome.opponent.id).toBe(joiner.id);
    });

    it('is invalid outside game_over, or for an unknown player', () => {
      const { manager, room, host } = playingRoom(); // still playing
      expect(manager.requestRematch(room.code, host.id).type).toBe('invalid');

      const over = gameOverRoom();
      expect(over.manager.requestRematch(over.room.code, 'nobody').type).toBe('invalid');
    });
  });

  describe('resetForRematch', () => {
    it('clears words, flags, and the game, returning to word_setup', () => {
      const { manager, room, host, joiner } = gameOverRoom();
      host.wantsRematch = true;
      joiner.wantsRematch = true;

      manager.resetForRematch(room);

      expect(room.phase).toBe('word_setup');
      expect(room.game).toBeNull();
      expect(host.secretWord).toBeNull();
      expect(joiner.secretWord).toBeNull();
      expect(host.wantsRematch).toBe(false);
      expect(joiner.wantsRematch).toBe(false);
    });
  });

  describe('sweepIdleRooms', () => {
    const IDLE_MS = ROOM_IDLE_TIMEOUT_MINUTES * 60_000;

    it('removes rooms idle past the timeout and keeps fresh ones', () => {
      const manager = new RoomManager();
      const stale = manager.createRoom('Idle');
      const fresh = manager.createRoom('Active');
      const now = 1_000_000_000_000;
      stale.lastActivityAt = now - IDLE_MS - 1;
      fresh.lastActivityAt = now;

      const removed = manager.sweepIdleRooms(now);

      expect(removed.map((r) => r.code)).toEqual([stale.code]);
      expect(manager.getRoom(stale.code)).toBeUndefined();
      expect(manager.getRoom(fresh.code)).toBe(fresh);
    });

    it('keeps a room exactly at the threshold (only strictly older is swept)', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Edge');
      const now = 1_000_000_000_000;
      room.lastActivityAt = now - IDLE_MS; // exactly at cutoff, not past it

      expect(manager.sweepIdleRooms(now)).toEqual([]);
      expect(manager.getRoom(room.code)).toBe(room);
    });
  });

  describe('score (Phase 7)', () => {
    it('players start at 0', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('Alice');
      expect(room.players[0].score).toBe(0);
      const join = manager.joinRoom(room.code, 'Bob');
      if (!join.ok) throw new Error('join failed');
      expect(join.player.score).toBe(0);
    });

    it('recordRoundResult awards exactly one point to the winner', () => {
      const { manager, room } = gameOverRoom(); // active player solved → winner set
      const winnerId = room.game!.winnerId!;

      manager.recordRoundResult(room);

      const winner = room.players.find((p) => p.id === winnerId)!;
      const loser = room.players.find((p) => p.id !== winnerId)!;
      expect(winner.score).toBe(1);
      expect(loser.score).toBe(0);
    });

    it('recordRoundResult is a no-op while a round is still in progress', () => {
      const { manager, room } = playingRoom();
      manager.recordRoundResult(room);
      expect(room.players.every((p) => p.score === 0)).toBe(true);
    });

    it('a forfeit awards the surviving player a point', () => {
      const { manager, room, host, joiner } = playingRoom();
      manager.forfeit(room.code, host.id);
      expect(joiner.score).toBe(1);
      expect(host.score).toBe(0);
    });

    it('score survives a rematch reset', () => {
      const { manager, room, host, joiner } = gameOverRoom();
      host.score = 2;
      joiner.score = 1;

      manager.resetForRematch(room);

      expect(host.score).toBe(2);
      expect(joiner.score).toBe(1);
    });

    it('leaving (revert to waiting) resets the survivor score for a fresh pairing', () => {
      const { manager, room, host, joiner } = gameOverRoom();
      host.score = 3;
      joiner.score = 2;

      const result = manager.leaveRoom(room.code, joiner.id);

      if (!result || result.destroyed) throw new Error('expected a revert, not destroy');
      expect(result.remaining.id).toBe(host.id);
      expect(host.score).toBe(0);
    });
  });
});

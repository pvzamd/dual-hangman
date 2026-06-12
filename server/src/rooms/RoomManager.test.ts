import { describe, expect, it } from 'vitest';
import { ROOM_CODE_LENGTH } from '@dual-hangman/shared';
import { RoomManager } from './RoomManager.js';

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
});

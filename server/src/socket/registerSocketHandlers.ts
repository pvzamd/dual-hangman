import {
  MAX_PLAYER_NAME_LENGTH,
  RECONNECT_GRACE_SECONDS,
  type ErrorCode,
} from '@dual-hangman/shared';
import type { RoomManager } from '../rooms/RoomManager.js';
import { buildRoomView, toPlayerInfo } from '../rooms/roomView.js';
import type { GameServer, GameSocket } from './types.js';

const JOIN_FAILURE_MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: 'No room with that code exists.',
  ROOM_FULL: 'That room already has two players.',
  INVALID_PHASE: 'That room is not accepting players right now.',
};

/**
 * Registers every event from the shared contract for one connection.
 * Lobby events (create/join/leave/reconnect) are live as of Phase 2;
 * word/guess/chat land in Phases 3, 4, and 6 (see docs/ROADMAP.md).
 */
export function registerSocketHandlers(
  io: GameServer,
  socket: GameSocket,
  roomManager: RoomManager,
): void {
  socket.on('create_room', ({ playerName }) => {
    const name = sanitizeName(playerName);
    if (!name) return emitError(socket, 'INVALID_NAME', invalidNameMessage());
    if (socket.data.roomCode) {
      return emitError(socket, 'INVALID_PHASE', 'Leave your current room first.');
    }

    const room = roomManager.createRoom(name);
    const host = room.players[0];
    bindSocket(socket, room.code, host.id, host);
    socket.emit('room_created', {
      roomCode: room.code,
      playerId: host.id,
      reconnectToken: host.reconnectToken,
    });
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const name = sanitizeName(playerName);
    if (!name) return emitError(socket, 'INVALID_NAME', invalidNameMessage());
    if (socket.data.roomCode) {
      return emitError(socket, 'INVALID_PHASE', 'Leave your current room first.');
    }

    const result = roomManager.joinRoom(roomCode, name);
    if (!result.ok) {
      return emitError(socket, result.error, JOIN_FAILURE_MESSAGES[result.error]);
    }

    const { room, player } = result;
    bindSocket(socket, room.code, player.id, player);
    const host = roomManager.getOpponent(room, player.id);
    socket.emit('room_joined', {
      roomCode: room.code,
      playerId: player.id,
      reconnectToken: player.reconnectToken,
      opponent: toPlayerInfo(host!),
    });
    socket.to(room.code).emit('opponent_joined', { opponent: toPlayerInfo(player) });
    io.to(room.code).emit('word_setup_started');
  });

  socket.on('leave_room', () => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;
    socket.leave(roomCode);
    socket.data.roomCode = undefined;
    socket.data.playerId = undefined;
    removeAndNotify(io, roomManager, roomCode, playerId);
  });

  socket.on('reconnect_player', ({ roomCode, playerId, reconnectToken }) => {
    const hit = roomManager.validateReconnect(roomCode, playerId, reconnectToken);
    if (!hit) {
      return emitError(
        socket,
        'RECONNECT_REJECTED',
        'That room no longer exists or your credentials are invalid.',
      );
    }

    const { room, player } = hit;
    roomManager.cancelGraceTimer(room.code, player.id);
    const wasDisconnected = !player.connected;
    bindSocket(socket, room.code, player.id, player);
    socket.emit('state_sync', { state: buildRoomView(room, player.id) });
    if (wasDisconnected) {
      socket.to(room.code).emit('opponent_reconnected');
    }
  });

  socket.on('disconnect', (reason) => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;
    const room = roomManager.getRoom(roomCode);
    const player = room && roomManager.getPlayer(room, playerId);
    if (!room || !player) return;
    // A reconnected player owns a newer socket; this stale disconnect is moot.
    if (player.socketId !== socket.id) return;

    console.log(`[socket] player ${player.name} disconnected from ${roomCode} (${reason})`);
    player.connected = false;
    player.socketId = null;
    socket.to(roomCode).emit('opponent_disconnected', { graceSeconds: RECONNECT_GRACE_SECONDS });
    roomManager.startGraceTimer(roomCode, playerId, RECONNECT_GRACE_SECONDS, () => {
      // TODO Phase 4: during `playing`, grace expiry must forfeit instead.
      removeAndNotify(io, roomManager, roomCode, playerId);
    });
  });

  socket.on('submit_secret_word', () => notImplemented(socket, 'submit_secret_word (Phase 3)'));
  socket.on('guess_letter', () => notImplemented(socket, 'guess_letter (Phase 4)'));
  socket.on('chat_message', () => notImplemented(socket, 'chat_message (Phase 6)'));
}

function bindSocket(
  socket: GameSocket,
  roomCode: string,
  playerId: string,
  player: { socketId: string | null; connected: boolean },
): void {
  player.socketId = socket.id;
  player.connected = true;
  socket.data.roomCode = roomCode;
  socket.data.playerId = playerId;
  socket.join(roomCode);
}

/** Removes the player and resyncs whoever is left in the room. */
function removeAndNotify(
  io: GameServer,
  roomManager: RoomManager,
  roomCode: string,
  playerId: string,
): void {
  const result = roomManager.leaveRoom(roomCode, playerId);
  if (result && !result.destroyed) {
    io.to(roomCode).emit('state_sync', {
      state: buildRoomView(result.room, result.remaining.id),
    });
  }
}

function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.trim();
  if (name.length === 0 || name.length > MAX_PLAYER_NAME_LENGTH) return null;
  return name;
}

function invalidNameMessage(): string {
  return `Name must be 1–${MAX_PLAYER_NAME_LENGTH} characters.`;
}

function emitError(socket: GameSocket, code: ErrorCode, message: string): void {
  socket.emit('error_occurred', { code, message });
}

function notImplemented(socket: GameSocket, feature: string): void {
  emitError(socket, 'NOT_IMPLEMENTED', `${feature} is not implemented yet.`);
}

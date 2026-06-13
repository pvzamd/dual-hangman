import {
  MAX_PLAYER_NAME_LENGTH,
  MAX_WORD_LENGTH,
  MIN_WORD_LENGTH,
  RECONNECT_GRACE_SECONDS,
  normalizeChatText,
  normalizeSecretWord,
  type ErrorCode,
} from '@dual-hangman/shared';
import { GameManager } from '../game/GameManager.js';
import type { RoomManager } from '../rooms/RoomManager.js';
import { buildRoomView, toPlayerInfo } from '../rooms/roomView.js';
import type { GameServer, GameSocket } from './types.js';

const JOIN_FAILURE_MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: 'No room with that code exists.',
  ROOM_FULL: 'That room already has two players.',
  INVALID_PHASE: 'That room is not accepting players right now.',
};

// Grace window before a disconnected player forfeits. Overridable via env
// (handy for tuning and for tests that can't wait the full default).
const GRACE_SECONDS = Number(process.env.RECONNECT_GRACE_SECONDS) || RECONNECT_GRACE_SECONDS;

/**
 * Registers every event from the shared contract for one connection.
 * All events are live: lobby (Phase 2), word setup (Phase 3), guessing +
 * forfeit (Phase 4), rematch (Phase 5), and chat (Phase 6).
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
    handleExit(io, roomManager, roomCode, playerId);
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
    socket.to(roomCode).emit('opponent_disconnected', { graceSeconds: GRACE_SECONDS });
    roomManager.startGraceTimer(roomCode, playerId, GRACE_SECONDS, () => {
      // Grace expired: forfeit if a round is in progress, else revert/destroy.
      handleExit(io, roomManager, roomCode, playerId);
    });
  });

  socket.on('submit_secret_word', ({ word }) => {
    const { roomCode, playerId } = socket.data;
    const room = roomCode ? roomManager.getRoom(roomCode) : undefined;
    const player = room && playerId ? roomManager.getPlayer(room, playerId) : undefined;
    if (!room || !player) {
      return emitError(socket, 'INVALID_PHASE', 'You are not in a room.');
    }
    if (room.phase !== 'word_setup') {
      return emitError(socket, 'INVALID_PHASE', 'Words can only be set during word setup.');
    }

    const normalized = typeof word === 'string' ? normalizeSecretWord(word) : null;
    if (!normalized) {
      return emitError(
        socket,
        'INVALID_WORD',
        `Words must be ${MIN_WORD_LENGTH}–${MAX_WORD_LENGTH} letters, A–Z only.`,
      );
    }

    // Re-submitting before the round starts overwrites the previous word.
    const firstSubmission = player.secretWord === null;
    player.secretWord = normalized;
    room.lastActivityAt = Date.now();

    if (firstSubmission) {
      socket.to(room.code).emit('opponent_word_ready');
    }
    socket.emit('state_sync', { state: buildRoomView(room, player.id) });

    const [a, b] = room.players;
    if (room.players.length === 2 && a.secretWord && b.secretWord) {
      room.game = new GameManager(
        { playerId: a.id, secretWord: a.secretWord },
        { playerId: b.id, secretWord: b.secretWord },
      );
      room.phase = 'playing';
      // game_started is personalized — each player gets their own view.
      for (const p of room.players) {
        if (p.socketId) {
          io.to(p.socketId).emit('game_started', { state: buildRoomView(room, p.id) });
        }
      }
    }
  });

  socket.on('guess_letter', ({ letter }) => {
    const { roomCode, playerId } = socket.data;
    const room = roomCode ? roomManager.getRoom(roomCode) : undefined;
    const player = room && playerId ? roomManager.getPlayer(room, playerId) : undefined;
    if (!room || !player || !room.game || room.phase !== 'playing') {
      return emitError(socket, 'INVALID_PHASE', 'There is no game in progress.');
    }

    const outcome = room.game.guessLetter(player.id, typeof letter === 'string' ? letter : '');
    if (!outcome.ok) {
      return emitError(socket, outcome.error, GUESS_ERROR_MESSAGES[outcome.error]);
    }
    room.lastActivityAt = Date.now();

    if (room.game.isOver) {
      room.phase = 'game_over';
      // Personalized: game_won state reveals each player's own target word.
      for (const p of room.players) {
        if (p.socketId) {
          io.to(p.socketId).emit('game_won', {
            winnerId: room.game.winnerId!,
            reason: room.game.gameOverReason!,
            state: buildRoomView(room, p.id),
          });
        }
      }
      return;
    }

    // guess_result carries the full refreshed view — the single source the UI
    // re-renders from. Personalized so each side sees its own boards.
    for (const p of room.players) {
      if (p.socketId) {
        io.to(p.socketId).emit('guess_result', {
          guesserId: player.id,
          letter: outcome.letter,
          correct: outcome.correct,
          state: buildRoomView(room, p.id),
        });
      }
    }

    // Turn only moves on a wrong guess (correct guesses keep the streak).
    if (outcome.turnPassed) {
      io.to(room.code).emit('turn_changed', { activePlayerId: room.game.activePlayerId });
    }
  });

  socket.on('request_rematch', () => {
    const { roomCode, playerId } = socket.data;
    const room = roomCode ? roomManager.getRoom(roomCode) : undefined;
    const player = room && playerId ? roomManager.getPlayer(room, playerId) : undefined;
    if (!room || !player) {
      return emitError(socket, 'INVALID_PHASE', 'You are not in a room.');
    }

    const outcome = roomManager.requestRematch(room.code, player.id);
    switch (outcome.type) {
      case 'invalid':
        return emitError(socket, 'INVALID_PHASE', 'A rematch is only available after a game.');

      case 'requested':
        // Let the opponent know an offer is waiting; the requester's UI already
        // reflects its own click.
        if (outcome.opponent.socketId) {
          io.to(outcome.opponent.socketId).emit('rematch_requested');
        }
        return;

      case 'started':
        // Fresh round — both clients return to word setup.
        for (const p of room.players) {
          if (p.socketId) {
            io.to(p.socketId).emit('rematch_started', { state: buildRoomView(room, p.id) });
          }
        }
        return;

      case 'unavailable': {
        // Opponent has gone: tell the requester, then revert the room to the
        // lobby (remove the absent opponent) so they land back in waiting.
        socket.emit('rematch_unavailable');
        const result = roomManager.leaveRoom(room.code, outcome.opponent.id);
        if (result && !result.destroyed) {
          io.to(room.code).emit('state_sync', {
            state: buildRoomView(result.room, result.remaining.id),
          });
        }
        return;
      }
    }
  });

  socket.on('chat_message', ({ text }) => {
    const { roomCode, playerId } = socket.data;
    const room = roomCode ? roomManager.getRoom(roomCode) : undefined;
    const player = room && playerId ? roomManager.getPlayer(room, playerId) : undefined;
    if (!room || !player) return; // not in a room — ignore silently

    const clean = typeof text === 'string' ? normalizeChatText(text) : null;
    if (!clean) return;

    room.lastActivityAt = Date.now();
    // Broadcast to the whole room (sender included) so both clients render from
    // the same source. Chat is ephemeral — no persistence (ADR-002).
    io.to(room.code).emit('chat_message', {
      senderId: player.id,
      senderName: player.name,
      text: clean,
    });
  });
}

const GUESS_ERROR_MESSAGES: Record<string, string> = {
  NOT_YOUR_TURN: "It's not your turn.",
  ALREADY_GUESSED: 'You already guessed that letter.',
  INVALID_LETTER: 'Guess a single letter A–Z.',
  INVALID_PHASE: 'The game is not in progress.',
};

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

/**
 * A player leaving the room — explicitly (leave_room) or by grace-timer
 * expiry. During `playing` this is a forfeit: the opponent wins immediately.
 * In any other phase it keeps the lobby behavior (revert to waiting / destroy).
 */
function handleExit(
  io: GameServer,
  roomManager: RoomManager,
  roomCode: string,
  playerId: string,
): void {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  if (room.phase === 'playing') {
    const result = roomManager.forfeit(roomCode, playerId);
    if (result && result.winner.socketId) {
      io.to(result.winner.socketId).emit('game_won', {
        winnerId: result.winner.id,
        reason: 'opponent_forfeit',
        state: buildRoomView(result.room, result.winner.id),
      });
    }
    return;
  }

  removeAndNotify(io, roomManager, roomCode, playerId);
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

import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@dual-hangman/shared';
import type { RoomManager } from '../rooms/RoomManager.js';

type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Registers every event from the shared contract for one connection.
 * All handlers are skeletons — real logic lands phase by phase
 * (see docs/ROADMAP.md). Keeping the full contract registered now means
 * the client can develop against stable event names from day one.
 */
export function registerSocketHandlers(
  _io: GameServer,
  socket: GameSocket,
  _roomManager: RoomManager,
): void {
  socket.on('create_room', () => notImplemented(socket, 'create_room (Phase 2)'));
  socket.on('join_room', () => notImplemented(socket, 'join_room (Phase 2)'));
  socket.on('submit_secret_word', () => notImplemented(socket, 'submit_secret_word (Phase 3)'));
  socket.on('guess_letter', () => notImplemented(socket, 'guess_letter (Phase 4)'));
  socket.on('reconnect_player', () => notImplemented(socket, 'reconnect_player (Phase 6)'));
  socket.on('leave_room', () => notImplemented(socket, 'leave_room (Phase 2)'));
  socket.on('chat_message', () => notImplemented(socket, 'chat_message (Phase 6)'));

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);
    // TODO Phase 6: look up the player's room, mark them disconnected,
    // start the reconnection grace timer.
  });
}

function notImplemented(socket: GameSocket, feature: string): void {
  socket.emit('error_occurred', {
    code: 'NOT_IMPLEMENTED',
    message: `${feature} is not implemented yet.`,
  });
}

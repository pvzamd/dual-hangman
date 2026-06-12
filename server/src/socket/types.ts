import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, PlayerId, ServerToClientEvents } from '@dual-hangman/shared';

/** Per-socket session data: which room/player this connection is bound to. */
export interface SocketData {
  roomCode?: string;
  playerId?: PlayerId;
}

type InterServerEvents = Record<string, never>;

export type GameServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type GameSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

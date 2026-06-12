import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@dual-hangman/shared';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * App-wide socket singleton. autoConnect is off — pages call
 * socket.connect() when entering a flow that needs the server
 * (wired up in Phase 2).
 */
export const socket: GameSocket = io(SERVER_URL, {
  autoConnect: false,
});

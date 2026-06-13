import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@dual-hangman/shared';

// Default to the same host the page was served from, on the server port. This
// makes LAN play work with no config: opening http://<host-ip>:5173 on a phone
// connects the socket to http://<host-ip>:3001. Override with VITE_SERVER_URL
// when the server is elsewhere (e.g. production). See docs/LOCAL_PLAYTESTING.md.
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? `http://${window.location.hostname}:3001`;

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * App-wide socket singleton. autoConnect is off — pages call
 * socket.connect() when entering a flow that needs the server
 * (wired up in Phase 2).
 */
export const socket: GameSocket = io(SERVER_URL, {
  autoConnect: false,
});

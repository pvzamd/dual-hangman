import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@dual-hangman/shared';
import { registerSocketHandlers } from './socket/registerSocketHandlers.js';
import type { GameServer, SocketData } from './socket/types.js';
import { RoomManager } from './rooms/RoomManager.js';

const PORT = Number(process.env.PORT ?? 3001);
// CLIENT_ORIGIN locks CORS to one origin in production. When unset (local dev
// and LAN playtesting) we reflect the request origin so any device on the
// network can connect without per-IP configuration. See docs/LOCAL_PLAYTESTING.md.
const corsOrigin: string | boolean = process.env.CLIENT_ORIGIN ?? true;

const app = express();
app.use(cors({ origin: corsOrigin }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);

const io: GameServer = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(httpServer, {
  cors: { origin: corsOrigin },
});

const roomManager = new RoomManager();

// Periodically reclaim abandoned rooms (idle past ROOM_IDLE_TIMEOUT_MINUTES).
// unref() so the timer never keeps the process alive on shutdown.
const SWEEP_INTERVAL_MS = 60_000;
setInterval(() => {
  const removed = roomManager.sweepIdleRooms();
  if (removed.length > 0) {
    console.log(
      `[server] swept ${removed.length} idle room(s): ${removed.map((r) => r.code).join(', ')}`,
    );
  }
}, SWEEP_INTERVAL_MS).unref();

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);
  registerSocketHandlers(io, socket, roomManager);
});

// listen() with no host binds all interfaces, so the server is reachable on
// the LAN at http://<host-ip>:PORT as well as localhost.
httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT} (also on this machine's LAN IP)`);
  console.log(
    `[server] CORS origin: ${typeof corsOrigin === 'string' ? corsOrigin : 'reflect any (dev/LAN)'}`,
  );
});

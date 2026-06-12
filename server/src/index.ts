import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@dual-hangman/shared';
import { registerSocketHandlers } from './socket/registerSocketHandlers.js';
import type { GameServer, SocketData } from './socket/types.js';
import { RoomManager } from './rooms/RoomManager.js';

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));

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
  cors: { origin: CLIENT_ORIGIN },
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);
  registerSocketHandlers(io, socket, roomManager);
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] allowing CORS origin ${CLIENT_ORIGIN}`);
});

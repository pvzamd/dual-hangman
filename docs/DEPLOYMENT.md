# Deployment

## Overview

Dual Hangman deploys as two components:

1. **Server** — single-file Node bundle (`server/dist/index.js`) serving the Socket.IO endpoint + `/health`.
2. **Client** — static Vite build (`client/dist/`) for any static host/CDN.

Runtime requirement: **Node ≥ 22.12** (see ADR-008).

## Environment Variables

### Server (`server/.env.example`)

| Variable                  | Required   | Default                 | Description                                                   |
| ------------------------- | ---------- | ----------------------- | ------------------------------------------------------------- |
| `PORT`                    | No         | `3001`                  | Port the Express/Socket.IO server listens on                  |
| `CLIENT_ORIGIN`           | Yes (prod) | `http://localhost:5173` | CORS allowed origin (e.g. `https://dual-hangman.vercel.app`)  |
| `RECONNECT_GRACE_SECONDS` | No         | `60`                    | Seconds a disconnected player may reconnect before forfeiting |

### Client (`client/.env.example`)

| Variable          | Required   | Default                 | Description          |
| ----------------- | ---------- | ----------------------- | -------------------- |
| `VITE_SERVER_URL` | Yes (prod) | `http://localhost:3001` | Socket.IO server URL |

`.env.example` files live in each package. Never commit real `.env` files (gitignored).

## Local Development

```bash
# From repo root — requires Node 22.12+ (nvm use 24)
npm install
npm run dev      # client :5173 + server :3001 concurrently
```

## Production Build

```bash
npm run build
# → client/dist/          static site (Vite)
# → server/dist/index.js  single ESM file, shared types bundled in (tsup)
```

Run the server with:

```bash
node server/dist/index.js
```

## Hosting Options

### Option A — Unified (server serves static client)

Deploy the Node server to **Railway** or **Render** and add an `express.static(client/dist)` handler (small change in `server/src/index.ts` when we get there).

Pros: single deployment, no CORS config. Cons: server handles static traffic.

### Option B — Split (recommended)

- Server → **Railway** / **Render** / **Fly.io**
- Client → **Vercel** or **Netlify**
- Set `CLIENT_ORIGIN` on the server and `VITE_SERVER_URL` at client build time.

### Railway (server)

1. Connect GitHub repo; root directory: repo root (workspaces need the root lockfile).
2. Build command: `npm install && npm run build -w server`
3. Start command: `node server/dist/index.js`
4. Set `CLIENT_ORIGIN`; Railway injects `PORT` automatically.

### Vercel (client)

1. Connect GitHub repo; root directory: `client/`.
2. Framework preset: Vite (build runs `tsc && vite build`).
3. Set `VITE_SERVER_URL` to the deployed server URL.

## WebSocket Notes

- Railway: WebSocket supported on all plans.
- Render: supported; free tier spins down after inactivity → first connection is slow.
- Fly.io: supported.
- In-memory state (ADR-002) means **one server instance only** — do not autoscale horizontally without first adding a shared store (Redis).

## Health Check

`GET /health` → `{ "status": "ok" }` — wired up and smoke-tested; use it for platform health checks and uptime monitoring.

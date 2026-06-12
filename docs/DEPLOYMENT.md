# Deployment

## Overview

Dual Hangman requires two deployed components:

1. **Server** — Node.js process serving both the Socket.IO WebSocket endpoint and (optionally) the static client build.
2. **Client** — Static React build. Can be served by the Node server or a separate CDN/hosting service.

## Environment Variables

### Server

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Port the Express server listens on |
| `CLIENT_ORIGIN` | Yes (prod) | — | CORS allowed origin (e.g. `https://dual-hangman.vercel.app`) |
| `NODE_ENV` | No | `development` | Set to `production` in prod |

### Client

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_SERVER_URL` | Yes (prod) | `http://localhost:3001` | Socket.IO server URL |

Create a `.env.example` in each package directory. Never commit real `.env` files.

## Local Development

```bash
# From repo root
npm install
npm run dev      # starts both client (port 5173) and server (port 3001) concurrently
```

## Production Build

```bash
npm run build    # builds client to client/dist and compiles server TypeScript
```

## Hosting Options

### Option A — Unified (server serves static client)

Deploy the Node server to **Railway** or **Render**. Build the client and copy `client/dist` to a location Express serves statically.

Pros: single deployment, no CORS config needed.  
Cons: server handles static file traffic.

### Option B — Split (recommended for scaling)

- Deploy server to **Railway** / **Render** / **Fly.io**.
- Deploy client build to **Vercel** or **Netlify**.
- Configure `CLIENT_ORIGIN` on the server and `VITE_SERVER_URL` on the client build.

### Railway (recommended for server)

1. Connect GitHub repo.
2. Set root directory to `server/`.
3. Set build command: `npm run build`.
4. Set start command: `node dist/index.js`.
5. Add environment variables via Railway dashboard.

### Vercel (recommended for client)

1. Connect GitHub repo.
2. Set root directory to `client/`.
3. Framework preset: Vite.
4. Add `VITE_SERVER_URL` environment variable.

## WebSocket on Hosting Platforms

Most modern platforms support WebSocket. Confirm the plan/tier supports persistent connections:
- Railway: supported on all plans.
- Render: supported; free tier may spin down after inactivity (causes connection delay on first load).
- Fly.io: supported.

## Health Check

The server exposes `GET /health` returning `{ status: "ok" }` — use this for platform health checks / uptime monitoring.

# Architectural Decisions

> Record significant decisions here with rationale and trade-offs. Helps future sessions understand _why_ the code is the way it is.

---

## ADR-001 — Technology Stack

**Date:** 2026-06-13  
**Status:** Accepted

### Decision

Frontend: React 18 + TypeScript + Vite  
Backend: Node.js + Express + Socket.IO + TypeScript

### Rationale

- React is the dominant UI library; component model maps naturally to game boards and keyboard widgets.
- Vite gives a fast dev server and clean TypeScript support out of the box.
- Socket.IO is the standard choice for real-time browser games; it handles WebSocket with graceful HTTP fallback and provides a room abstraction that fits game lobbies directly.
- TypeScript on both ends allows sharing type definitions (event payloads, game state), preventing protocol drift.

### Trade-offs

- Could have used plain WebSockets (smaller bundle) but Socket.IO's room/broadcast API saves meaningful boilerplate.
- Could have used Next.js for SSR, but this game has no SEO or initial-load content requirements; a pure SPA is simpler.

---

## ADR-002 — No Database at MVP

**Date:** 2026-06-13  
**Status:** Accepted

### Decision

Game state is held in-memory on the server. No database is used at MVP.

### Rationale

- Simplest path to a working game. Removes an entire infrastructure dependency.
- Games are ephemeral by nature — if the server restarts, in-flight games are lost, which is acceptable for a hobby project.
- A leaderboard or persistent stats would require a DB; that is deferred to a later phase.

### Trade-offs

- Server restart loses all active rooms.
- Cannot scale horizontally without a shared state store (e.g. Redis pub/sub). Acceptable at MVP with a single server instance.

### Upgrade Path

If persistence is needed later: add Redis for session storage and a Postgres DB for user accounts and scores.

---

## ADR-003 — Monorepo with npm Workspaces

**Date:** 2026-06-13  
**Status:** Accepted (implemented in Phase 1)

### Decision

Use a single repository with `npm workspaces`: `shared/`, `client/`, and `server/` as workspace packages.

### Rationale

- Keeps code collocated for a solo developer.
- Allows a `shared/` package for types used by both client and server without publishing to npm.
- Single `npm install` at the root installs all dependencies.

### Trade-offs

- Slightly more complex root `package.json`.
- Simpler alternative (two separate repos) would avoid workspace overhead but makes type sharing harder.

---

## ADR-004 — Turn-Based (Alternating) Guessing

**Date:** 2026-06-13 (resolved in Phase 1)  
**Status:** Accepted

### Decision

Players alternate turns: one letter per turn, the turn passes after every guess regardless of correctness. First turn assigned randomly.

### Rationale

- The required socket contract (`turn_changed`) and gameplay docs assumed a turn model — turn-based is the design the event protocol was shaped around.
- Dramatically simpler win conditions: only one player acts at a time, so word-solved / hanged / forfeit always resolves unambiguously and **draws are impossible**. Simultaneous play needed tie-breakers (fewer wrong guesses, then elapsed time).
- Simpler server logic and simpler UI (one clear "your turn / their turn" state).

### Trade-offs

- The waiting player has dead time each turn. Mitigated by watching the opponent's board update live.
- Simultaneous "race mode" is more frantic and could return later as a game mode; the `GameView.activePlayerId` field would simply be `null` in that mode, so the protocol does not block it.

---

## ADR-005 — Tailwind CSS 4 for Styling

**Date:** 2026-06-13  
**Status:** Accepted

### Decision

Tailwind CSS v4 via the first-party `@tailwindcss/vite` plugin; a single `@import 'tailwindcss'` in `index.css`. No tailwind.config file unless customisation demands one.

### Rationale

- Utility classes keep styling collocated with the small number of game components; no naming/cascade overhead for a solo project.
- v4's Vite plugin needs zero config and builds only the classes used (10 kB CSS at skeleton stage).

### Trade-offs

- Markup is more verbose than CSS Modules. Accepted for development speed.

---

## ADR-006 — Source-Only `shared` Package

**Date:** 2026-06-13  
**Status:** Accepted

### Decision

`@dual-hangman/shared` ships raw TypeScript (`main`/`types` → `src/index.ts`) with **no build step**. Consumers compile it themselves: Vite (client) and `tsx` (server dev) handle TS on the fly; `tsup` bundles it into the production server file via `noExternal`.

### Rationale

- Zero build orchestration: no "rebuild shared before X" footgun after weeks away from the project — important for resumability.
- Type changes propagate instantly to both apps in dev.

### Trade-offs

- `shared` cannot be published to npm as-is (irrelevant — it is private).
- Every consumer must be able to compile TS (all current consumers can).
- Production server build must bundle it — encoded once in `server/tsup.config.ts`.

---

## ADR-007 — Reconnection via Token + Grace Period

**Date:** 2026-06-13  
**Status:** Accepted (implementation lands Phase 6)

### Decision

On room create/join the server issues `{ playerId, reconnectToken }`; the client persists them in `localStorage`. A disconnected player has `RECONNECT_GRACE_SECONDS` (60 s) to emit `reconnect_player` with valid credentials; the server then rebinds the socket and resyncs via `state_sync`. Grace expiry mid-game forfeits the round.

### Rationale

- Mobile browsers and flaky Wi-Fi make raw socket lifetime a bad identity; a token survives refreshes and network blips.
- A bounded grace period keeps the opponent from waiting forever, while forfeit (not draw) keeps the win conditions total.

### Trade-offs

- Tokens in `localStorage` are readable by any JS on the origin — acceptable for a game with no accounts or stakes.
- 60 s is a guess; tune after real play-testing.

---

## ADR-008 — Node.js 22.12+ Baseline

**Date:** 2026-06-13  
**Status:** Accepted

### Decision

Require Node ≥ 22.12 (`engines` in root package.json); develop on Node 24 LTS.

### Rationale

Node 18 (previous dev machine default) is end-of-life and below the minimum for Vite 7+/8 and Tailwind 4. Node 24 is the newest LTS (supported to 2028), which suits a project that may pause for long stretches.

---

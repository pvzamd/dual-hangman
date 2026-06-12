# Architectural Decisions

> Record significant decisions here with rationale and trade-offs. Helps future sessions understand *why* the code is the way it is.

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
**Status:** Proposed (to implement in Phase 1)

### Decision
Use a single repository with `npm workspaces`: `client/` and `server/` as workspace packages.

### Rationale
- Keeps code collocated for a solo developer.
- Allows a `shared/` package for types used by both client and server without publishing to npm.
- Single `npm install` at the root installs all dependencies.

### Trade-offs
- Slightly more complex root `package.json`.
- Simpler alternative (two separate repos) would avoid workspace overhead but makes type sharing harder.

---

## ADR-004 — Simultaneous vs Turn-Based Guessing (TBD)

**Date:** 2026-06-13  
**Status:** Open — needs decision before Phase 4

### Options

**Option A — Simultaneous:**  
Both players guess at any time, no waiting for the opponent's turn. First to solve wins.

**Option B — Alternating Turns:**  
Players alternate. Player A guesses, then Player B guesses, and so on.

### Notes
Simultaneous play is more exciting and removes the "waiting" dead time, but makes the win condition (fewer wrong guesses / faster time) more complex. Turn-based is simpler to implement. Decision deferred until Phase 3 design.

---

# Session Notes

---

## Session 1 — 2026-06-13

### Work Completed

- Established the full documentation system under `docs/`.
- Created `CLAUDE_CONTEXT.md` for future session continuity.
- Wrote `README.md` with project summary and dev instructions.
- Configured `.gitignore` and `.gitattributes` (LF normalization for Windows dev).
- Added `CLAUDE.md` bootstrap file (auto-loaded by Claude Code, points to `CLAUDE_CONTEXT.md` and states the docs-update workflow).
- Created empty folder skeleton: `client/src/`, `client/public/`, `server/src/`.
- Defined game rules, architecture, roadmap, decisions log, deployment notes.

### Decisions Made This Session

- Technology stack chosen: React + Vite (client), Node + Express + Socket.IO (server), both in TypeScript. Rationale documented in `DECISIONS.md`.
- Simultaneous vs turn-based guessing marked as TBD pending further design.
- No database at MVP — in-memory room state only.

### Next Recommended Action

Begin **Phase 1 — Project Scaffolding**:

1. `cd client && npm create vite@latest . -- --template react-ts`
2. `cd server && npm init -y && npm install express socket.io && npm install -D typescript ts-node @types/node @types/express`
3. Set up root `package.json` with `workspaces: ["client", "server"]` and a `dev` script using `concurrently`.

---

## Session 2 — 2026-06-13

### Work Completed

- **Phase 1 (Project Scaffolding) complete.**
- Upgraded dev machine Node 18 → 24 LTS via nvm (Node 18 is EOL and below Vite/Tailwind minimums); root `engines` requires ≥ 22.12 (ADR-008).
- Created npm workspaces monorepo: `shared/`, `client/`, `server/`.
- `shared/`: source-only package (ADR-006) with game constants, state model (`GameView`, `BoardView`, `PlayerInfo`), and the full typed socket contract (`ClientToServerEvents` / `ServerToClientEvents`).
- Client: Vite + React 19 + TypeScript + Tailwind CSS 4 + react-router 7; typed socket singleton; skeleton pages Home / Create / Join / Lobby.
- Server: Express 5 + Socket.IO with CORS and `/health`; handlers registered for the whole contract as NOT_IMPLEMENTED stubs; RoomManager skeleton (room codes, ServerPlayer with reconnect tokens); GameManager skeleton. Dev via `tsx watch`, prod build via `tsup` (bundles shared).
- ESLint 10 flat configs + Prettier everywhere; root scripts `dev` / `build` / `lint` / `typecheck` / `format`.
- Verified: all typechecks, lint, prod builds pass; built server smoke-tested (`/health` + Socket.IO polling handshake).

### Decisions Made This Session

- **ADR-004 resolved: turn-based alternating guessing** (turn passes after every guess; random first turn; draws impossible). Simultaneous mode noted as a possible future game mode.
- ADR-005 Tailwind 4; ADR-006 source-only shared package; ADR-007 reconnection = token + 60s grace; ADR-008 Node ≥ 22.12.
- Game rules updated to match the turn model (GAME_RULES.md).

### Gotchas / Environment Notes

- On this machine, the assistant's shell fails on bare `npm` — use `npm.cmd` instead.
- Game/architecture docs: `shared/src/events.ts` is the compile-time truth for the socket contract; ARCHITECTURE.md mirrors it.

### Next Recommended Action

Begin **Phase 2 — Lobby System**: implement `RoomManager.joinRoom`, wire `create_room` / `join_room` / `leave_room` handlers, connect the client pages to the socket, and start Vitest with RoomManager unit tests. See PROGRESS.md Phase 2 checklist.

---

## Session 3 — 2026-06-13

### Work Completed

- **Continuity & onboarding system** (no code changes).
- Created `START_HERE.md`: universal tool-agnostic entry point with project summary, status, 60-second architecture, ADR summary table, documentation index (purpose / update triggers / authority per file), AI handoff section, 8-step development workflow, and mandatory documentation maintenance rules.
- Established the authority model: GAME_RULES (rules), PROGRESS (completion), DECISIONS (choices), ROADMAP (scope), DEPLOYMENT (env/hosting), `shared/src/events.ts` (socket protocol); PROJECT_OVERVIEW/README/CLAUDE_CONTEXT are derived summaries; SESSION_NOTES is an append-only log whose old entries are never rewritten.
- Deduplicated: `CLAUDE.md` is now a slim Claude-Code-specific bootstrap (read order + machine quirks like `npm.cmd`); the generic workflow rules moved to START_HERE.md; CLAUDE_CONTEXT no longer repeats the harness quirks.
- Consistency sweep across all docs: only stale item found was ADR-001 still saying "React 18" — amended to note the React 19 scaffold. Session 1's log entry mentioning ts-node/two-package workspaces left untouched (append-only log; Session 2 records what actually happened).
- README now points to START_HERE.md at the top.

### Next Recommended Action

Unchanged from Session 2: begin **Phase 2 — Lobby System** (PROGRESS.md checklist). New sessions should start from `START_HERE.md`.

---

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

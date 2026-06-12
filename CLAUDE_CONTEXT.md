# Claude Context — Dual Hangman

> This file is the fast-load context for any new Claude session.
> Read this first. Update it at the end of every session.
> Last updated: 2026-06-13

---

## What This Project Is

A real-time two-player browser hangman game. Both players simultaneously try to guess each other's secret word. Built as a production-quality hobby project by Parvez Ahmed.

**GitHub:** https://github.com/pvzamd/dual-hangman

---

## Current Phase

**Phase 0 — Repository Foundation (COMPLETE)**

The skeleton is in place. No gameplay code exists. Next step is Phase 1: scaffolding (Vite + React client, Node + Express + Socket.IO server).

---

## Active Architecture

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + Socket.IO + TypeScript |
| State (runtime) | In-memory (no DB at MVP) |
| Monorepo | npm workspaces |

Full details in `docs/ARCHITECTURE.md`.

---

## Folder Structure

```
dual-hangman/
├── client/
│   ├── public/          ← static assets
│   └── src/             ← React app (empty at Phase 0)
├── server/
│   └── src/             ← Node server (empty at Phase 0)
├── docs/
│   ├── PROJECT_OVERVIEW.md
│   ├── GAME_RULES.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── PROGRESS.md
│   ├── SESSION_NOTES.md
│   ├── DECISIONS.md
│   └── DEPLOYMENT.md
├── CLAUDE.md            ← auto-loaded by Claude Code; points here
├── CLAUDE_CONTEXT.md    ← you are here
├── README.md
├── .gitignore
├── .gitattributes
└── LICENSE
```

---

## Outstanding Tasks

- [ ] Phase 1: Initialise Vite + React client (`client/`)
- [ ] Phase 1: Initialise Node + Express + Socket.IO server (`server/`)
- [ ] Phase 1: Root `package.json` workspaces + concurrent dev script
- [ ] Phase 1: tsconfig for both packages
- [ ] Phase 1: ESLint + Prettier
- [ ] Phase 2: Lobby system (room create/join)
- [ ] Phase 3: Word setup
- [ ] Phase 4: Core gameplay loop
- [ ] Phase 5: Game over + restart

Full roadmap in `docs/ROADMAP.md`. Fine-grained checkboxes in `docs/PROGRESS.md`.

---

## Known Issues / Open Questions

- **ADR-004 unresolved:** Simultaneous vs turn-based guessing not decided. Must be settled before Phase 4. See `docs/DECISIONS.md`.
- No test infrastructure set up yet (deferred to Phase 1).

---

## Key Conventions to Follow

- TypeScript everywhere — no plain JS files in `client/src/` or `server/src/`.
- Shared event names and payload types live in a `shared/` package or `server/src/socket/events.ts` (exported for client import).
- `.env` files are never committed. Use `.env.example` as a template.
- Update `docs/PROGRESS.md` when completing any task.
- Update `docs/SESSION_NOTES.md` with a new entry at the end of each session.
- Update this file (`CLAUDE_CONTEXT.md`) whenever the current phase or outstanding tasks change.

---

## Next Recommended Step

```bash
# 1. Scaffold the client
cd client
npm create vite@latest . -- --template react-ts

# 2. Scaffold the server
cd ../server
npm init -y
npm install express socket.io cors
npm install -D typescript tsx @types/node @types/express @types/cors

# 3. Set up root package.json with workspaces + concurrently dev script
```

After scaffolding, verify both run with `npm run dev` from the root before moving to Phase 2.

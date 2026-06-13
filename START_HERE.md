# START HERE — Dual Hangman

> **The first document any developer or AI assistant should read.**
> Reading time: ~5 minutes. Everything else is linked from here.

---

## 1. What This Project Is

Dual Hangman is a real-time two-player browser game. Each player sets a secret word (3–12 letters); players then take turns guessing letters of each other's word — **a correct guess earns another guess, a wrong one passes the turn**. The only way to win is to fully reveal the opponent's word first; wrong guesses carry no penalty (the hangman figure is just the loser's defeat visual). It is a production-quality hobby project by Parvez Ahmed, built to survive long development pauses — the documentation system you are reading exists so any session (human or AI) can resume cold.

**Repo:** https://github.com/pvzamd/dual-hangman · **License:** MIT

---

## 2. Current Status

|                     |                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Completed**       | Phases 0–5: foundation, scaffolding + typed contract, lobby (incl. reconnection), word setup, core gameplay, game over + rematch                                                                             |
| **Current phase**   | **Phase 6 — Polish & Resilience** (not started)                                                                                                                                                              |
| **Next task**       | Idle room sweep (`ROOM_IDLE_TIMEOUT_MINUTES`), chat sidebar, animations, responsive layout; checklist in [docs/PROGRESS.md](docs/PROGRESS.md)                                                                |
| **Working**         | A full game loop end-to-end: rooms, word setup, turn-based guessing (streaks, turn transfer, win-by-reveal), forfeit, game-over screen with both words + defeat figure, mutual-opt-in rematch; 51 unit tests |
| **Not working yet** | Idle room sweep, chat, animations beyond basic, scoring (Phase 7)                                                                                                                                            |

> Keep this table phase-accurate. Fine-grained, always-current state lives in [docs/PROGRESS.md](docs/PROGRESS.md) and [CLAUDE_CONTEXT.md](CLAUDE_CONTEXT.md).

---

## 3. Architecture in 60 Seconds

npm-workspaces monorepo, TypeScript everywhere, server-authoritative:

```
shared/   @dual-hangman/shared — game constants, state model (GameView),
          and the typed Socket.IO contract (events.ts). SOURCE-ONLY: no
          build step; Vite/tsx compile it in dev, tsup bundles it for prod.
client/   React 19 + Vite + Tailwind 4 + react-router 7 SPA.
          Pages: Home, Create, Join, Lobby, Game. useGame hook owns
          the socket subscription + GameView. Typed socket singleton.
server/   Node ≥22.12 + Express 5 + Socket.IO 4. /health endpoint,
          RoomManager (rooms, codes, reconnect tokens), GameManager
          (turn rules + win detection). tsx watch dev, tsup ESM build.
```

Two invariants everything else hangs on:

1. **The server is authoritative.** The opponent's unsolved word never appears in any payload; all rule enforcement is server-side.
2. **`shared/src/events.ts` is the compile-time truth for the socket protocol.** Both sides consume it as Socket.IO generics; [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) mirrors it in prose.

Full design (room lifecycle, turn model, win conditions, reconnection): [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 4. Important Decisions (ADR summaries)

Full rationale and trade-offs in [docs/DECISIONS.md](docs/DECISIONS.md).

| ADR | Decision                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 001 | React + Vite + TS frontend; Node + Express + Socket.IO + TS backend                                                                                         |
| 002 | **No database at MVP** — rooms live in server memory; one instance only                                                                                     |
| 003 | npm workspaces monorepo: `shared/`, `client/`, `server/`                                                                                                    |
| 004 | **Turn-based guessing** (amended by ADR-009); draws impossible                                                                                              |
| 005 | Tailwind CSS 4 via `@tailwindcss/vite`                                                                                                                      |
| 006 | `shared` is a source-only package (no build step)                                                                                                           |
| 007 | Reconnection = `reconnectToken` + 60 s grace period, then forfeit                                                                                           |
| 008 | Node ≥ 22.12 baseline (dev on Node 24 LTS)                                                                                                                  |
| 009 | **Win by full reveal only** — correct guess continues the turn, wrong guess passes it; no loss by wrong guesses; hangman figure is the cosmetic loss visual |
| 010 | Lobby sync = `reconnect_player` → `state_sync` on every connect; leaving a two-player lobby reverts the room to waiting instead of destroying it            |
| 011 | Dedicated `/game` route + shared `useGame` hook with phase-driven navigation; `game_won` reveals each player's own target word                              |
| 012 | Rematch is mutual opt-in (reuses the word_setup flow); declining = leaving; both secret words revealed at game over                                         |

---

## 5. Documentation Index

Rule of thumb: **when two documents disagree, the authoritative one wins and the other gets fixed.**

| File                                                   | Purpose                                                            | Update when…                                                | Authority                                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **START_HERE.md**                                      | Entry point, doc map, workflow                                     | A phase completes, a doc is added/renamed, workflow changes | Authoritative for the doc map and workflow                                                                |
| [docs/GAME_RULES.md](docs/GAME_RULES.md)               | Gameplay rules                                                     | Any rule changes — update **before** coding it              | **Source of truth: game rules**                                                                           |
| [docs/PROGRESS.md](docs/PROGRESS.md)                   | Checkbox tracker per phase                                         | Every completed task, immediately                           | **Source of truth: what is done**                                                                         |
| [docs/DECISIONS.md](docs/DECISIONS.md)                 | ADRs with rationale                                                | A significant technical choice is made or reversed          | **Source of truth: decisions & why**                                                                      |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)           | System design, models, socket protocol in prose                    | Architecture or socket contract changes                     | Authoritative for design narrative; `shared/src/events.ts` outranks it on event details                   |
| [docs/ROADMAP.md](docs/ROADMAP.md)                     | Phase plan + future ideas                                          | Scope changes, phases reordered, features added/dropped     | **Source of truth: planned scope**                                                                        |
| [docs/SESSION_NOTES.md](docs/SESSION_NOTES.md)         | Append-only dev log per session                                    | End of every working session                                | Historical log — **never rewrite old entries** (they may contain superseded plans; the newest entry wins) |
| [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)   | Goals + tech table + status blurb                                  | Stack or status changes                                     | Summary — defers to DECISIONS/ARCHITECTURE on conflict                                                    |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)               | Hosting, env vars, build/run commands                              | Env vars, build outputs, or hosting plans change            | **Source of truth: deployment & env**                                                                     |
| [docs/LOCAL_PLAYTESTING.md](docs/LOCAL_PLAYTESTING.md) | Run locally + play from a 2nd device on the LAN; testing checklist | LAN setup, ports, or the playtest checklist change          | **Source of truth: local/LAN playtesting**                                                                |
| [CLAUDE_CONTEXT.md](CLAUDE_CONTEXT.md)                 | Volatile session snapshot: phase, task list, repo map, gotchas     | End of every session                                        | Snapshot — defers to PROGRESS.md on completion state                                                      |
| [CLAUDE.md](CLAUDE.md)                                 | Claude Code bootstrap + machine-specific quirks                    | Claude-specific tooling quirks change                       | Claude-only; other AIs may skip it                                                                        |
| [README.md](README.md)                                 | GitHub landing page for humans                                     | Status line or commands change                              | Summary — defers to everything above                                                                      |
| `shared/src/events.ts`                                 | Typed socket contract (code)                                       | Any protocol change                                         | **Source of truth: socket protocol**                                                                      |

---

## 6. AI Handoff

Everything a fresh AI session (Claude, Gemini, ChatGPT, Copilot, or anything later) needs:

- **State:** Scaffolding complete and verified (typecheck, lint, prod builds, `/health` + Socket.IO handshake smoke test). Zero gameplay logic. All socket handlers are registered stubs returning `NOT_IMPLEMENTED`.
- **Completed phases:** 0 (foundation), 1 (scaffolding + architecture + typed contract).
- **Remaining phases:** 2 lobby → 3 word setup → 4 core gameplay → 5 game over/rematch → 6 polish & reconnection → 7 scoring. Details: [docs/ROADMAP.md](docs/ROADMAP.md).
- **Stack:** React 19 / TS / Vite / Tailwind 4 / react-router 7 · Node ≥22.12 / Express 5 / Socket.IO 4 · npm workspaces · no DB.
- **Known issues:** none in code. Environment: dev machine uses nvm-windows — run `nvm use 24` (other local projects pin older Nodes). No automated tests yet — start Vitest alongside Phase 2 server logic.
- **Open questions:** none blocking. Deferred decisions: hosting provider (DEPLOYMENT.md lists options), styling of game screens, scoring rules (Phase 7).
- **Conventions:** TypeScript only; snake_case socket events defined solely in `shared/src/events.ts`; rules change in GAME_RULES.md before code; new significant choices get the next ADR (ADR-009 is next).

### Onboarding a new AI session

Give the AI this prompt (works for any assistant with repo access):

```
This repository is documented for cold-start continuation. Read START_HERE.md
at the repo root first and follow its Development Workflow section. Then
continue development: implement the next unchecked items in docs/PROGRESS.md
for the current phase. Respect the documentation maintenance rules in
START_HERE.md — update PROGRESS.md, SESSION_NOTES.md, and CLAUDE_CONTEXT.md
before finishing, and commit with a descriptive message.
```

---

## 7. Development Workflow

Every working session, in order:

1. **Read `START_HERE.md`** (this file) — orient.
2. **Read `docs/PROGRESS.md`** — what is done, what is next.
3. **Read `CLAUDE_CONTEXT.md`** — detailed task list, repo map, gotchas.
4. **Skim the latest entry in `docs/SESSION_NOTES.md`** — what the last session did and recommended.
5. **Review open items in `docs/ROADMAP.md`** for the current phase.
6. **Implement** the next phase/tasks. Verify: `npm run typecheck && npm run lint && npm run build` (plus tests once they exist).
7. **Update documentation** per the maintenance rules below.
8. **Commit** with a descriptive message explaining what and why.

### Resuming after a long pause

`git log --oneline -10` + the latest SESSION_NOTES.md entry + PROGRESS.md gives full context in under five minutes. Then `nvm use 24 && npm install && npm run dev`.

---

## 8. Mandatory Documentation Maintenance Rules

**Whenever code changes, before the work is considered done:**

| Always                  |                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------- |
| `docs/PROGRESS.md`      | Tick completed tasks (add tasks if you did unplanned work)                       |
| `docs/SESSION_NOTES.md` | Append a session entry: date, work completed, decisions, next recommended action |
| `CLAUDE_CONTEXT.md`     | Refresh phase, outstanding tasks, gotchas, "last updated"                        |

| When applicable        |                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `docs/ROADMAP.md`      | Scope was added, dropped, or re-ordered                                                       |
| `docs/ARCHITECTURE.md` | Architecture or the socket contract changed (keep tables in sync with `shared/src/events.ts`) |
| `docs/DECISIONS.md`    | A significant technical decision was made — add the next ADR                                  |
| `docs/GAME_RULES.md`   | Gameplay behaviour changed (update **before** implementing)                                   |
| `docs/DEPLOYMENT.md`   | Env vars, build commands, or hosting changed                                                  |
| `START_HERE.md`        | A phase completed, or docs were added/renamed                                                 |
| `README.md`            | Status line or dev commands changed                                                           |

A code change without its documentation updates is an **incomplete change** — do not commit it as finished work.

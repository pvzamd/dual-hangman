# Progress Tracker

> Check off tasks as they are completed. This is the canonical done/not-done record.

## Phase 0 — Repository Foundation ✅

- [x] Repository initialised on GitHub (`pvzamd/dual-hangman`)
- [x] MIT License added
- [x] `.gitignore` configured
- [x] `docs/` directory created with all documentation files
- [x] `CLAUDE_CONTEXT.md` created
- [x] Folder skeleton created
- [x] `README.md` written

## Phase 1 — Project Scaffolding ✅

- [x] Root npm workspaces (`shared`, `client`, `server`) + scripts
- [x] Node baseline ≥ 22.12 (`engines`), dev machine on Node 24 via nvm
- [x] `shared/`: constants, game state types, typed socket event contract
- [x] Client: Vite + React 19 + TS + Tailwind 4 + react-router 7
- [x] Client: typed socket singleton (`src/socket.ts`)
- [x] Client pages: Home, Create Room, Join Room, Lobby (skeletons)
- [x] Server: Express 5 + Socket.IO bootstrap with CORS + `/health`
- [x] Server: socket handler registration (full contract, NOT_IMPLEMENTED stubs)
- [x] Server: RoomManager skeleton (room map, code generation, ServerPlayer model)
- [x] Server: GameManager skeleton
- [x] ESLint flat config + Prettier across packages
- [x] `npm run dev` (concurrently), `build`, `lint`, `typecheck`, `format` all working
- [x] Verified: typecheck ✅ lint ✅ prod builds ✅ health + Socket.IO handshake ✅
- [x] Docs updated: architecture, rules (turn-based), ADRs 004–008

## Continuity & Onboarding (between Phases 1 and 2) ✅

- [x] `START_HERE.md` — universal entry point with doc index, AI handoff, workflow, maintenance rules
- [x] Documentation index with per-file purpose / update triggers / authority
- [x] `CLAUDE.md` slimmed to Claude-specific bootstrap + machine quirks (deduplicated)
- [x] Consistency sweep: ADR-001 React version amended; no other conflicts found
- [x] README links START_HERE.md prominently

## Phase 2 — Lobby System ✅

- [x] `RoomManager.joinRoom` with validation (not found / full / wrong phase)
- [x] `RoomManager.leaveRoom` — last player destroys room; otherwise revert to waiting (ADR-010)
- [x] `create_room` handler → `room_created`
- [x] `join_room` handler → `room_joined` / `opponent_joined` / `word_setup_started` / errors
- [x] `leave_room` handler → `state_sync` to remaining player
- [x] Basic reconnection (pulled forward from Phase 6): `reconnect_player` validation, socket rebind, `state_sync`, `opponent_disconnected`/`opponent_reconnected`, 60s grace timer
- [x] Client socket connect lifecycle (`connect_error` surfaced in UI)
- [x] CreateRoomPage wired (emit + navigate + error display)
- [x] JoinRoomPage wired (emit + error display)
- [x] LobbyPage: syncs via `reconnect_player` → `state_sync` on mount (ADR-010); reacts to `opponent_joined`, `word_setup_started`, disconnect/reconnect; leave button
- [x] Credentials persisted to localStorage (`client/src/lib/identity.ts`); HomePage "return to room" link
- [x] First Vitest tests — 12 RoomManager unit tests
- [x] End-to-end smoke test of all lobby flows over real sockets

## Phase 3 — Word Setup ✅

- [x] Shared `normalizeSecretWord` — one validation source for client + server
- [x] `submit_secret_word` handler: phase guard, validation, storage, re-submission overwrites before start
- [x] Ready states in `GameView` (`yourWordReady` / `opponentWordReady`) — survive refresh via `state_sync`
- [x] `opponent_word_ready` emitted on first submission
- [x] Transition to `playing`: GameManager created (boards + random first turn), personalized `game_started` to each player
- [x] Client: `WordSetupForm` with inline validation; lobby shows ready badges and turn announcement
- [x] Tests: word validation, GameManager init, roomView projection incl. anti-cheat assertion (24 total)
- [x] Live smoke test: validation, ready flow, resync mid-setup, game start, no word leakage, mid-game reconnect

## Phase 4 — Core Gameplay

- [ ] `guessLetter`: turn enforcement — correct guess continues turn, wrong guess passes it (ADR-009)
- [ ] Wrong-guess counting (statistics only — no penalty)
- [ ] Win detection (`word_solved` only)
- [ ] `buildViewFor` per-player projection
- [ ] `useGame` hook
- [ ] Word display (blanks + revealed letters)
- [ ] On-screen keyboard with disabled guessed letters
- [ ] Live board sync + turn indicator

## Phase 5 — Game Over & Restart

- [ ] Result screen (incl. wrong-guess stats)
- [ ] Hangman figure as loser's defeat visual (ADR-009)
- [ ] Rematch flow

## Phase 6 — Polish & Resilience

- [ ] In-game reconnection: grace expiry during `playing` forfeits (lobby-level reconnection shipped in Phase 2)
- [ ] Idle room sweep
- [ ] Chat sidebar
- [ ] Animations
- [ ] Responsive layout

## Phase 7 — Scoring

- [ ] Session score tracking
- [ ] Score display

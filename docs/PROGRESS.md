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

## Phase 2 — Lobby System

- [ ] `RoomManager.joinRoom` with validation
- [ ] `create_room` handler → `room_created`
- [ ] `join_room` handler → `room_joined` / `opponent_joined` / errors
- [ ] `leave_room` handler
- [ ] Client socket connect lifecycle
- [ ] CreateRoomPage wired (emit + navigate)
- [ ] JoinRoomPage wired (emit + error display)
- [ ] LobbyPage reacts to `opponent_joined` / `word_setup_started`
- [ ] Credentials persisted to localStorage
- [ ] First Vitest tests (RoomManager)

## Phase 3 — Word Setup

- [ ] `submit_secret_word` validation + storage
- [ ] Transition to `playing` + `game_started` when both words in
- [ ] Secret word input screen

## Phase 4 — Core Gameplay

- [ ] `guessLetter`: turn enforcement, reveal, wrong-guess counting
- [ ] Win detection (word_solved / opponent_hanged)
- [ ] `buildViewFor` per-player projection
- [ ] `useGame` hook
- [ ] Hangman SVG figure
- [ ] Word display (blanks + revealed letters)
- [ ] On-screen keyboard with disabled guessed letters
- [ ] Live board sync + turn indicator

## Phase 5 — Game Over & Restart

- [ ] Result screen
- [ ] Rematch flow

## Phase 6 — Polish & Resilience

- [ ] Reconnection flow (token + grace + `state_sync`)
- [ ] Idle room sweep
- [ ] Chat sidebar
- [ ] Animations
- [ ] Responsive layout

## Phase 7 — Scoring

- [ ] Session score tracking
- [ ] Score display

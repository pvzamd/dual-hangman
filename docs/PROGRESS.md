# Progress Tracker

> Check off tasks as they are completed. This is the canonical done/not-done record.

## Phase 0 — Repository Foundation

- [x] Repository initialised on GitHub (`pvzamd/dual-hangman`)
- [x] MIT License added
- [x] `.gitignore` configured
- [x] `docs/` directory created with all documentation files
- [x] `CLAUDE_CONTEXT.md` created
- [x] `client/src/` and `client/public/` directories created
- [x] `server/src/` directory created
- [x] `README.md` written

## Phase 1 — Project Scaffolding

- [ ] Client Vite + React + TypeScript initialised
- [ ] Server Node + Express + Socket.IO + TypeScript initialised
- [ ] Root `package.json` workspaces configured
- [ ] `tsconfig.json` for both client and server
- [ ] ESLint + Prettier configured
- [ ] Concurrent dev script working
- [ ] Hello-world verified in browser

## Phase 2 — Lobby System

- [ ] Server room creation logic
- [ ] Server room join logic
- [ ] `room:create` socket event
- [ ] `room:join` socket event
- [ ] Client lobby page
- [ ] Room code display and waiting state
- [ ] Error handling for invalid room codes

## Phase 3 — Word Setup

- [ ] `word:submit` socket event
- [ ] Server transitions to PLAYING when both words submitted
- [ ] Client secret word input screen
- [ ] Word validation

## Phase 4 — Core Gameplay

- [ ] `guess:letter` socket event
- [ ] Wrong-guess counter per player
- [ ] Win/lose detection
- [ ] Hangman SVG figure
- [ ] Word display (blanks + revealed letters)
- [ ] On-screen keyboard with disable state
- [ ] Live board sync for both players

## Phase 5 — Game Over & Restart

- [ ] `game:over` broadcast
- [ ] Result screen
- [ ] Rematch flow

## Phase 6 — Polish

- [ ] Chat sidebar
- [ ] Animations
- [ ] Responsive layout
- [ ] Connection drop / reconnection handling

## Phase 7 — Scoring

- [ ] Session score tracking
- [ ] Score display

# Roadmap

## Phase 0 — Repository Foundation ✅

- [x] Git repository initialised
- [x] `.gitignore` configured
- [x] `docs/` documentation system created
- [x] `CLAUDE_CONTEXT.md` created
- [x] Folder skeleton: `client/`, `server/`, `docs/`
- [x] `README.md` written

## Phase 1 — Project Scaffolding ✅

- [x] npm workspaces monorepo: `shared/`, `client/`, `server/`
- [x] Client: Vite + React 19 + TypeScript + Tailwind CSS 4
- [x] Server: Express 5 + Socket.IO + TypeScript (`tsx watch` dev, `tsup` build)
- [x] Shared: typed socket contract (`events.ts`), game state model (`types.ts`), constants
- [x] ESLint (flat config) + Prettier in all packages
- [x] Root `npm run dev` runs client + server concurrently
- [x] Skeleton pages: Home, Create Room, Join Room, Lobby
- [x] Server skeletons: `/health`, socket handler registration, RoomManager, GameManager
- [x] Architecture documented: room lifecycle, turn model, win conditions, reconnection (ADRs 004–008)
- [x] Verified: typecheck, lint, prod builds, `/health` + Socket.IO handshake smoke test

## Phase 2 — Lobby System

- [ ] Server: implement `RoomManager.joinRoom` (capacity, phase validation)
- [ ] Server: wire `create_room`, `join_room`, `leave_room` handlers
- [ ] Client: connect socket; CreateRoomPage emits `create_room`, navigates on `room_created`
- [ ] Client: JoinRoomPage emits `join_room`, handles `ROOM_NOT_FOUND` / `ROOM_FULL`
- [ ] Client: LobbyPage reacts to `opponent_joined` / `word_setup_started`
- [ ] Persist `{ roomCode, playerId, reconnectToken }` to localStorage (groundwork for Phase 6)

## Phase 3 — Word Setup

- [ ] Server: `submit_secret_word` — validate (length, A–Z), store, emit `opponent_word_ready`
- [ ] Server: transition to `playing` + `game_started` (random first turn) when both words in
- [ ] Client: secret word input screen (hidden from opponent)

## Phase 4 — Core Gameplay

- [ ] Server: `GameManager.guessLetter` — turn enforcement, reveal/wrong-guess, win detection
- [ ] Server: emit `guess_result`, `turn_changed`, `game_won`
- [ ] Server: `GameManager.buildViewFor` — per-player `GameView` projection
- [ ] Client: `useGame` hook owning socket subscription + `GameView`
- [ ] Client: hangman SVG figure, word display, on-screen keyboard (guessed letters disabled)
- [ ] Client: both boards update live; clear your-turn / their-turn indicator

## Phase 5 — Game Over & Restart

- [ ] Client: result screen (winner, reason, revealed words)
- [ ] Rematch flow back to `word_setup`

## Phase 6 — Polish & Resilience

- [ ] Reconnection: `reconnect_player` + grace timer + `state_sync` (ADR-007)
- [ ] Idle room sweep (`ROOM_IDLE_TIMEOUT_MINUTES`)
- [ ] Chat sidebar (`chat_message`)
- [ ] Animations (letter reveal, hangman draw)
- [ ] Responsive layout (mobile-friendly)
- [ ] Sound effects (optional)

## Phase 7 — Scoring & Multi-Round

- [ ] Persistent score across rounds in a session
- [ ] Best-of-N match config

## Nice-to-Have / Future

- [ ] Simultaneous "race mode" (ADR-004 trade-off note)
- [ ] Word categories / difficulty levels
- [ ] Word validation against a dictionary API
- [ ] Spectator mode
- [ ] Persistent leaderboard (requires DB)
- [ ] PWA / installable
- [ ] Automated tests (Vitest) — start alongside Phase 2 server logic

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

## Phase 2 — Lobby System ✅

- [x] Server: `RoomManager.joinRoom` (capacity, phase validation) + `leaveRoom` (revert-or-destroy, ADR-010)
- [x] Server: `create_room`, `join_room`, `leave_room` handlers wired
- [x] Server: basic reconnection pulled forward from Phase 6 — `reconnect_player`, grace timer, `state_sync`
- [x] Client: CreateRoomPage emits `create_room`, navigates on `room_created`
- [x] Client: JoinRoomPage emits `join_room`, surfaces `ROOM_NOT_FOUND` / `ROOM_FULL`
- [x] Client: LobbyPage syncs via `reconnect_player` → `state_sync` (ADR-010), reacts to lobby events
- [x] Identity persisted to localStorage; HomePage rejoin link
- [x] Vitest started: 12 RoomManager unit tests

## Phase 3 — Word Setup ✅

- [x] Server: `submit_secret_word` — validate (shared `normalizeSecretWord`), store, emit `opponent_word_ready`
- [x] Server: transition to `playing` + personalized `game_started` (random first turn) when both words in
- [x] Client: secret word form in lobby with inline validation + ready badges
- [x] `GameView` gained `yourWordReady`/`opponentWordReady` so refresh mid-setup restores correctly

## Phase 4 — Core Gameplay ✅

- [x] Server: `GameManager.guessLetter` — turn enforcement; correct guess = same player continues, wrong guess = turn passes (ADR-009)
- [x] Server: win detection — `word_solved` only (no loss by wrong guesses); `game_won` reveals each player's target word
- [x] Server: emit `guess_result`, `turn_changed` (only on wrong guesses), `game_won`
- [x] Client: `useGame` hook owning socket subscription + `GameView` (shared by Lobby/Game pages)
- [x] Client: `GamePage` + `GameBoard`, `WordDisplay`, `GuessedLetters`, on-screen `Keyboard` (guessed letters disabled), wrong-guess stats counter
- [x] Client: both boards update live; clear your-turn / their-turn indicator; navigate to game on `playing`

## Phase 5 — Game Over & Restart ✅

- [x] Client: game-over result panel (winner/loser/forfeit messaging, both words revealed)
- [x] Client: cosmetic hangman defeat figure for the loser (ADR-009)
- [x] Rematch flow back to `word_setup` — mutual opt-in, with decline/unavailable returning to the lobby (ADR-012)

## Phase 6 — Polish & Resilience ✅

- [x] In-game forfeit: leaving or grace-expiry during `playing` → opponent wins via `game_won` (`opponent_forfeit`) — shipped as a post-Phase-4 correctness fix (ADR-007)
- [x] Idle room sweep (`ROOM_IDLE_TIMEOUT_MINUTES`) — periodic, reclaims abandoned/ghost rooms
- [x] Chat sidebar (`chat_message`) — ephemeral, responsive
- [x] Subtle animations (letter reveal, game-over fade-in; respects reduced-motion)
- [x] Responsive polish (chat sidebar/stacked layout; copy-room-code)
- [ ] Sound effects (optional — deferred)

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

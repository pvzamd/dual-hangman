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

## Session 4 — 2026-06-13

### Work Completed

- **Rules revision (ADR-009)** — aligned GAME_RULES.md with the original game design:
  - Correct guess grants another immediate guess; wrong guess ends the turn.
  - 6-wrong-guess loss condition removed; `opponent_hanged` removed as a game-over reason.
  - Winning is **only** by fully revealing the opponent's word (forfeit remains as non-gameplay outcome).
  - Hangman figure is now cosmetic — drawn only at game over for the loser.
  - Wrong guesses still tracked (`BoardView.wrongGuesses`) for statistics/UI; no penalty.
- Shared contract updated to match (no logic existed, so zero migration cost): `GameOverReason` narrowed to `word_solved | opponent_forfeit`; `MAX_WRONG_GUESSES` constant and `BoardView.maxWrongGuesses` removed; GameManager TODO comments updated.
- Docs aligned: ARCHITECTURE (turn model with streaks, win conditions), ROADMAP + PROGRESS Phase 4/5 items (hangman figure moved to Phase 5 result screen), START_HERE, README, PROJECT_OVERVIEW, CLAUDE_CONTEXT; ADR-004 marked amended by ADR-009.
- Verified: typecheck, lint, build all green after type changes.

### Decisions Made This Session

- ADR-009 (see DECISIONS.md). Noted trade-off: streak rule increases first-turn advantage — revisit after play-testing.
- `turn_changed` is now emitted only on wrong guesses (correct guesses keep the turn).

### Next Recommended Action

Unchanged: begin **Phase 2 — Lobby System** (PROGRESS.md checklist). Phase 4 implementers: read ADR-009 before writing `GameManager.guessLetter`.

---

## Session 5 — 2026-06-13

### Work Completed

- **Phase 2 (Lobby System) complete**, including basic reconnection pulled forward from Phase 6.
- Server: `RoomManager` implemented (joinRoom with not-found/full/wrong-phase validation; leaveRoom with revert-or-destroy semantics; validateReconnect; grace timers). New `rooms/roomView.ts` projects Room → client-safe `GameView`. New `socket/types.ts` adds `SocketData` (roomCode/playerId per socket).
- Server handlers live: `create_room`, `join_room` (notifies host via `opponent_joined` + broadcasts `word_setup_started`), `leave_room`, `reconnect_player` (rebind + `state_sync` + `opponent_reconnected`), `disconnect` (marks away, `opponent_disconnected`, 60s grace → removal). Word/guess/chat remain stubs.
- Client: `lib/identity.ts` (localStorage save/load/clear with shape validation); Create/Join pages emit and navigate with inline error display; LobbyPage syncs via `reconnect_player` → `state_sync` on every socket `connect` (ADR-010), shows both players + connection dots + grace countdown notice, leave button; HomePage offers "Return to room" when an identity is stored.
- Shared: added `MAX_PLAYER_NAME_LENGTH` (used by server validation and client inputs).
- Tests: Vitest added to server — 12 RoomManager unit tests. Root `npm run test` wired.
- Verified: typecheck, lint, tests, builds; live end-to-end smoke test covering create, join, sync, disconnect-grace, fresh-socket reconnect, bad-token/unknown-room/full-room rejections, leave-revert, and room destruction.

### Decisions Made This Session

- **ADR-010**: lobby sync reuses `reconnect_player` → `state_sync` (one path for navigation, refresh, and reconnects); leaving a two-player lobby reverts the room to `waiting_for_opponent` instead of destroying it.
- ESLint: new react-hooks rules forbid ref writes during render — refs are now written in event handlers only.

### Next Recommended Action

Begin **Phase 3 — Word Setup**: implement `submit_secret_word` (validate with `MIN/MAX_WORD_LENGTH` + `VALID_WORD_PATTERN`, store uppercase, emit `opponent_word_ready`), transition to `playing` + `game_started` with a random first turn when both words are in, and replace LobbyPage's Phase-3 placeholder with the secret-word form. Note the two Phase-4 TODOs at `leaveRoom`/grace-expiry call sites (forfeit during `playing`).

---

## Session 6 — 2026-06-13

### Work Completed

- **Phase 3 (Word Setup) complete.**
- Shared: new `words.ts` with `normalizeSecretWord` (trim → uppercase → length/charset check) — single validation source for client inline feedback and server authority. `GameView` gained `yourWordReady` / `opponentWordReady` so a refresh during word setup restores the correct screen.
- Server: `submit_secret_word` handler — phase guard (`INVALID_PHASE`), validation (`INVALID_WORD`), storage on `ServerPlayer.secretWord` (re-submission overwrites before start), `opponent_word_ready` on first submission, `state_sync` ack to the submitter. When both words are in: `GameManager` constructed with boards over each other's words and a random first turn (`crypto.randomInt`), phase → `playing`, personalized `game_started` to each socket.
- `GameManager` now holds real round state (seats, boards via `boardFor`, active player, winner accessors); `guessLetter` remains the Phase-4 TODO. `roomView.buildRoomView` delegates board/turn/winner fields to the game.
- Client: `WordSetupForm` component (inline validation, uppercase input); LobbyPage renders the form during `word_setup`, shows "✓ word set / choosing…" badges per player, handles `opponent_word_ready` + `game_started`, and announces who goes first once playing.
- Tests up to 24: `normalizeSecretWord` cases, GameManager init (board orientation, masked boards, no winner), roomView projection including a deterministic anti-cheat assertion (test words use letters excluded from the room-code alphabet so secrets can never appear in any payload).
- Live smoke test: invalid-word rejections, ready-flag flow, mid-setup resync, simultaneous personalized `game_started` (consistent first turn, no word leakage), `INVALID_PHASE` after start, `guess_letter` still stubbed, mid-game reconnection restores boards.

### Decisions Made This Session

- Word validation lives in `shared/` — client and server cannot drift.
- Ready states are part of `GameView` rather than ad-hoc events only, keeping refresh/reconnect consistent (extends ADR-010's state_sync-first philosophy).
- Re-submitting a word before the round starts overwrites silently (friendly "changed my mind" behaviour).

### Next Recommended Action

Begin **Phase 4 — Core Gameplay** (read ADR-009 first): `GameManager.guessLetter` with turn streaks (correct → guess again, wrong → pass), `guess_result` / `turn_changed` / `game_won` emission, forfeit handling at the two TODO call sites, `opponentWordRevealed` at game over, and the guessing UI (likely a GamePage with keyboard + boards).

---

## Session 7 — 2026-06-13

### Work Completed

- **Phase 4 (Core Gameplay) complete.** Reviewed GAME_RULES.md first; implementation matches it exactly.
- Server `GameManager.guessLetter` (discriminated `GuessOutcome`): rejects game-over (`INVALID_PHASE`), invalid letters (`INVALID_LETTER`), out-of-turn (`NOT_YOUR_TURN`), and repeats (`ALREADY_GUESSED`) — rejections leave state untouched and never consume the turn. Correct guess reveals every occurrence and keeps the turn (streak); wrong guess increments `wrongGuesses` (stats only) and passes the turn; win is `word_solved` only. Added `targetWordFor` and `isOver`.
- `roomView.buildRoomView` now reveals each player's own target word at `game_over` via `opponentWordRevealed`.
- `guess_letter` handler: validates, applies, then emits personalized `guess_result` (or `game_won` on a win) to each socket, plus `turn_changed` to the room **only when the turn passed**.
- Client: `useGame(roomCode)` hook owns the socket subscription + `GameView` (shared by Lobby and Game pages; missing-identity ejection derived during render to satisfy the new `react-hooks/set-state-in-effect` lint rule). New `GamePage` + `GameBoard`, `WordDisplay`, `GuessedLetters`, on-screen `Keyboard` (guessed letters disabled/tinted, physical typing). New `/game/:roomCode` route; LobbyPage navigates there on `playing`, GamePage bounces back on a pre-game phase.
- Tests up to 38: comprehensive `guessLetter` coverage (streaks, wrong-guess turn pass, repeat/out-of-turn/invalid/after-over rejections, per-board repeat tracking, lowercase normalization, full-reveal win) and a roomView game-over reveal test. Helpers read `activePlayerId` so they're deterministic despite the random first turn.
- Live smoke test over real sockets: correct-keeps-turn (no `turn_changed`), wrong-passes-turn (`turn_changed` → opponent), `NOT_YOUR_TURN`, `ALREADY_GUESSED`, solve → `game_won` (winner + reason + loser's revealed word), `INVALID_PHASE` after game over, no secret leaked.

### Decisions Made This Session

- **ADR-011**: dedicated `/game` route + shared `useGame` hook with phase-driven navigation; `game_won` reveals each player's own target word.
- `turn_changed` is emitted only on wrong guesses; the client re-renders from the full `state` in `guess_result` / `game_won`, so the event is supplementary.

### Known Gap (intentionally deferred)

Leaving or disconnecting past grace **during `playing`** still reverts the room instead of forfeiting (TODOs in `RoomManager.leaveRoom` and the `disconnect` handler). This is wrong per the rules and is scheduled for **Phase 6** (it was out of this phase's scope). Lobby-phase leave/reconnect is correct.

### Next Recommended Action

Begin **Phase 5 — Game Over & Restart**: polish the result screen, add the cosmetic hangman defeat figure for the loser (ADR-009), and a rematch flow back to `word_setup` (new `rematch` event + GameManager reset). `GameBoard` already renders a basic game-over state to build on.

---

## Session 8 — 2026-06-13

### Work Completed

- **Closed the in-game forfeit correctness gap** (implements ADR-007's "grace → forfeit" + ADR-009's `opponent_forfeit` win; no new ADR needed). Scope was strictly the forfeit fix — no Phase 5 work.
- `GameManager.forfeit(playerId)`: the opponent wins by `opponent_forfeit`; no-op if the round is already decided (a late leave can't flip a win).
- `RoomManager.forfeit(code, playerId)`: valid only during `playing` (returns null otherwise). Cancels the grace timer, sets `game_over`, and keeps the forfeiter in `players` marked disconnected so the winner's `GameView` still renders both boards. The room is **not** destroyed.
- Socket handler: new `handleExit` routes both `leave_room` and grace-timer expiry — forfeit during `playing` (emit `game_won`/`opponent_forfeit` to the remaining player), otherwise the existing revert/destroy (`removeAndNotify`). Lobby-phase behavior is unchanged.
- `RECONNECT_GRACE_SECONDS` is now env-overridable (default 60) — useful for tuning and for tests that can't wait the full window. Documented in `server/.env.example` and DEPLOYMENT.md.
- Client: `GameBoard` banner is reason-aware ("You win — {opponent} left the game." on a forfeit win).
- Tests up to 46 (+8): `GameManager.forfeit` (opponent wins, regardless of turn, no overwrite of a decided game) and `RoomManager.forfeit` (playing → forfeit with both players kept + room intact; null in waiting/word_setup; null for unknown room/player).
- Live smoke test (server run with a 2s grace) covered **both** required scenarios plus the negative case: (A) explicit `leave_room` during play → opponent wins immediately by forfeit; (B) disconnect + grace expiry during play → opponent wins after ~2s; (C) leaving during `word_setup` → opponent gets `state_sync` back to `waiting_for_opponent`, no `game_won` (lobby behavior preserved).

### Decisions / Notes

- Kept the forfeiter in `room.players` (disconnected) rather than removing them, so the winner's board view renders without special-casing a missing opponent. The lingering room is reclaimed by the Phase 6 idle sweep.
- No new ADR: this realizes decisions already recorded in ADR-007 and ADR-009.

### Next Recommended Action

Unchanged: begin **Phase 5 — Game Over & Restart** (result screen polish, hangman defeat figure, rematch). The forfeit win path already produces a correct `game_over` state for the result screen to build on.

---

## Session 9 — 2026-06-13

### Work Completed

- **Phase 5 (Game Over & Restart) complete.** Updated GAME_RULES.md first (new "Game Over and Rematch" section).
- Shared contract: added `request_rematch` (client→server) and `rematch_requested` / `rematch_started` / `rematch_unavailable` (server→client); added `yourWordRevealed` to `GameView`.
- `roomView.buildRoomView`: at `game_over` reveals **both** secret words (`yourWordRevealed` = your own, `opponentWordRevealed` = opponent's), sourced from `ServerPlayer.secretWord`.
- `RoomManager`: `ServerPlayer.wantsRematch` flag; `requestRematch(code, playerId)` returns a discriminated outcome (`invalid` / `requested` / `started` / `unavailable`); `resetForRematch(room)` clears words/flags/game and returns to `word_setup`. `leaveRoom` now also clears the remaining player's `wantsRematch`.
- Socket handler: `request_rematch` maps the outcome — `requested` → notify opponent; `started` → personalized `rematch_started` to both; `unavailable` → `rematch_unavailable` + revert the requester to the lobby (remove absent opponent + `state_sync`).
- Client: `HangmanFigure` (static SVG defeat illustration). `GameBoard` now has a game-over result panel — both revealed words, the figure for the loser, and rematch controls (Play again / Accept rematch / Waiting… / unavailable, plus Leave). `useGame` tracks `youRequestedRematch` / `opponentWantsRematch` / `rematchUnavailable` and exposes `requestRematch`; rematch flags reset when leaving game_over. GamePage wires it through.
- Tests up to 51 (+5): `RoomManager.requestRematch` (waiting / both-started / unavailable / invalid) and `resetForRematch`; roomView now asserts both words revealed at game over and null while playing.
- Live smoke test over real sockets: (1) full rematch — both opt in, room resets to word_setup, and a **second** round actually plays; (2) decline-by-leave returns the requester to the lobby; (3) opponent disconnect → `rematch_unavailable` → requester reverts to the lobby.

### Decisions Made This Session

- **ADR-012**: rematch is mutual opt-in and reuses the `word_setup` flow (no new phase); declining is just leaving; both secret words are revealed at game over.
- No "same words again" shortcut — a rematch always re-collects words (re-using them would leak information).

### Next Recommended Action

Begin **Phase 6 — Polish & Resilience**: idle room sweep (`ROOM_IDLE_TIMEOUT_MINUTES`, also reclaims post-forfeit ghost rooms), chat sidebar (`chat_message` is still stubbed), animations, and responsive/mobile layout.

---

## Session 10 — 2026-06-13

### Work Completed

- **LAN playtesting support** (no gameplay/architecture/roadmap changes; Phase 6 not started). Three isolated config changes made LAN play work with zero per-session config:
  - `client/vite.config.ts`: `server.host: true` so Vite binds all interfaces and prints a Network URL other devices can open.
  - `client/src/socket.ts`: default the socket server URL to `http://${window.location.hostname}:3001` (was `http://localhost:3001`), so opening the client by host IP connects the socket to the same host. `VITE_SERVER_URL` still overrides.
  - `server/src/index.ts`: CORS origin defaults to reflecting the request origin (`process.env.CLIENT_ORIGIN ?? true`) so LAN origins are accepted; `CLIENT_ORIGIN` still locks it in production. Startup log updated; noted that `listen()` already binds all interfaces.
- New doc **`docs/LOCAL_PLAYTESTING.md`**: start commands, finding the host IP, opening from a phone, required config (none), Windows Firewall, Socket.IO troubleshooting table, multiplayer verification steps, and a full copy-paste checklist.
- Synced docs: `server/.env.example` (CLIENT_ORIGIN now commented/optional with explanation), DEPLOYMENT.md env table, ARCHITECTURE.md backend env line, START_HERE doc index, README (dev section + docs table).
- Verified: format, typecheck, lint, 51 tests, builds; plus a CORS smoke check confirming a LAN origin is reflected in `Access-Control-Allow-Origin`.

### Notes

- No new ADR: these are dev-server/CORS config conveniences, not architectural decisions. Production still locks CORS via `CLIENT_ORIGIN`.
- Gameplay, the socket contract, and the roadmap are untouched.

### Next Recommended Action

Playtest on real devices using `docs/LOCAL_PLAYTESTING.md`. When ready to resume building, begin **Phase 6 — Polish & Resilience**.

---

## Session 11 — 2026-06-13

### Work Completed

- **Playtest feedback: improved turn visibility** (presentation only — no gameplay/contract/roadmap changes).
- New `client/src/components/TurnIndicator.tsx`: a prominent, mobile-first, **sticky** top banner that always states whose turn it is via a high-contrast color block + bold label + a live (animated) dot — so turn ownership no longer relies on the keyboard's disabled state. States: **Your turn** (solid emerald), **{opponent}'s turn / Waiting for {name}…** (muted slate), opponent-disconnected countdown (amber), and win/lose at game over (emerald/red). `role="status"` + `aria-live="polite"` announces changes to screen readers.
- `GameBoard` now renders `TurnIndicator` in place of the old single-line header banner; removed the now-unused `banner`/`byForfeit` locals (the indicator derives all of it from `view`). The keyboard's disabled-when-not-your-turn behavior is unchanged.
- Synced docs: ARCHITECTURE module map (added TurnIndicator/HangmanFigure and the forfeit/rematch handler notes), CLAUDE_CONTEXT component list.
- Verified: format, typecheck, lint, 51 tests, builds.

### Notes

- No new ADR (pure UI/presentation). Gameplay logic, the socket contract, and the roadmap are untouched; Phase 6 not started.

### Next Recommended Action

Continue real-device playtesting (`docs/LOCAL_PLAYTESTING.md`). When ready to build again, begin **Phase 6 — Polish & Resilience**.

---

## Session 12 — 2026-06-13

### Work Completed

- **Phase 6 — Polish & Resilience**, in the requested priority order. Gameplay rules unchanged; the socket contract only gained behavior on the already-defined `chat_message` (backward compatible — no new events).
- **Idle room cleanup (resilience):** `RoomManager.sweepIdleRooms(now = Date.now())` removes rooms idle past `ROOM_IDLE_TIMEOUT_MINUTES` and returns them; `index.ts` runs it on a 60s `unref()`'d interval. This also reclaims the post-forfeit "ghost" room. `now` is injectable for tests.
- **Chat sidebar:** implemented the `chat_message` handler (was a stub) — validates with the new shared `normalizeChatText` (trim, drop empty, cap at `MAX_CHAT_LENGTH = 200`) and broadcasts `{ senderId, senderName, text }` to the room; ephemeral (no storage). Client: `GameChat` component (message list + input, auto-scroll, own/opponent styling) wired through `useGame` (`messages` + `sendChat`) and `GamePage`.
- **Responsive polish:** GameBoard is a single column on mobile and a two-column layout on `lg` with chat as a real sidebar (stacked below on small screens); container widened to `lg:max-w-5xl`.
- **Small UX:** copy-room-code button in the lobby (graceful no-op when the clipboard API is unavailable over plain-LAN http).
- **Subtle animations:** letter-reveal pop (`WordDisplay`, keyed so it plays once on reveal) and a game-over panel fade-in; keyframes in `index.css`, with a `prefers-reduced-motion` guard that neutralizes animations/transitions.
- Tests up to 57 (+6): `RoomManager.sweepIdleRooms` (removes stale, keeps fresh, strict threshold) and `normalizeChatText` (trim/empty/cap/normal). Live chat smoke test over real sockets: broadcast to both with sender identity + trim, empty ignored, length capped at 200.
- Docs synced: GAME_RULES (chat now present), ARCHITECTURE (module map + chat/idle-cleanup notes), PROGRESS + ROADMAP Phase 6 ticked, START_HERE status (now Phase 7 next), CLAUDE_CONTEXT. LOCAL_PLAYTESTING checklist gained a chat step.

### Notes

- No new ADR. Chat being ephemeral/broadcast-only is just ADR-002 (no DB) applied; idle sweep, responsive, and animations are features, not architectural decisions.
- Sound effects (the one optional Phase 6 item) intentionally **not** implemented.
- Did NOT touch: Phase 7 scoring, deployment, auth, databases, new game modes, or gameplay rules.

### Next Recommended Action

Playtest the polish on real devices. When ready, **Phase 7 — Scoring & Multi-Round** is next — start by deciding where session score state lives (still in-memory, per ADR-002).

---

## Session 13 — 2026-06-13

### Work Completed

- **Sound effects** — the one deferred optional Phase 6 item. Client-only; gameplay logic and the server untouched.
- New `client/src/lib/sound.ts`: synthesizes six short cues with the Web Audio API (no asset files) — `correct`, `wrong`, `your-turn`, `opponent-joined`, `won`, `lost` (ADR-013). Soft attack/decay envelopes keep them subtle.
- **Autoplay-safe:** the audio context is created/resumed on the first user gesture via a one-time listener in `App`; `playSound` stays silent until then.
- **Mute setting:** `SoundToggle` (fixed speaker button on every screen) persists on/off in `localStorage`; enabling plays a brief confirmation cue.
- Triggers wired into `useGame`'s existing handlers (no new state/logic): correct/wrong for **your own** guess only; your-turn on acquiring the turn (`turn_changed` to you, or first turn at `game_started`); opponent-joined for the host; won/lost per outcome. No sound on button clicks or key presses; no music.
- Verified: format, typecheck, lint, 57 tests, builds. No new server behavior → no new tests (and the client has no test runner; Web Audio isn't unit-testable in jsdom).
- Docs: ADR-013 added; PROGRESS + ROADMAP Phase 6 sound item ticked (Phase 6 now fully complete); ARCHITECTURE module map + sound note; START_HERE (ADR table + status); CLAUDE_CONTEXT.

### Notes

- Requirements met: respects autoplay restrictions, mute/unmute setting, subtle/short, no music, no per-click/keypress sound, gameplay unchanged.
- Manual check (browser) recommended during playtesting — synth cues can't be asserted in CI.

### Next Recommended Action

Phase 6 is fully done. Next is **Phase 7 — Scoring & Multi-Round** (decide where session score state lives, still in-memory per ADR-002), or more real-device playtesting first.

---

## Session 14 — 2026-06-13

### Work Completed

- **Phase 7 — session score tracking** (in-memory only; ADR-014). The core game is now feature-complete (Phases 0–7).
- Server: `ServerPlayer.score` (starts 0). `RoomManager.recordRoundResult(room)` awards the winner +1 and is called once per round end — from `forfeit` (`opponent_forfeit`) and from the `guess_letter` handler on a solve (`word_solved`), before the `game_won` views are built so they carry the new score. `resetForRematch` leaves score untouched (persists across rematches); `leaveRoom`'s revert-to-waiting resets the survivor's score so a new opponent starts 0–0.
- Shared: `GameView` gained `yourScore` / `opponentScore`; `roomView` fills them from `ServerPlayer.score`.
- Client: `GameBoard` shows a score line (`{you} N vs M {opponent}`) during play and a "Score: …" line on the game-over panel — both read straight from the synced view.
- Tests up to 64 (+7): `RoomManager` score lifecycle (start-at-0, award-once, no-op mid-round, forfeit awards, rematch preserves, leave resets) and a roomView score-projection test. Live score smoke test over real sockets: round win → 1–0, rematch preserves the total, a second round accumulates to 2 total, and a forfeit awards a point.
- Docs: GAME_RULES Scoring section rewritten (was "future"), ADR-014 added, ARCHITECTURE (GameView fields + scoring note), PROGRESS + ROADMAP Phase 7 ticked, START_HERE (status now feature-complete; ADR table), CLAUDE_CONTEXT.

### Notes

- Stayed within scope: no DB/Mongo, no auth/accounts/profiles, no leaderboards/history/stats pages, no best-of-N. Score is purely per-room, in-memory (dies with the room / on re-pairing).
- Resetting the survivor's score on re-pairing is a judgement call beyond the literal "reset on destroy" — a running tally vs a brand-new opponent would mislead, so a fresh pairing starts fresh (noted in ADR-014).

### Next Recommended Action

The game is feature-complete through Phase 7. Options: more real-device playtesting (`docs/LOCAL_PLAYTESTING.md`), a deployment pass (`docs/DEPLOYMENT.md`), or a Nice-to-Have from `docs/ROADMAP.md` (dictionary validation, spectator mode, PWA, simultaneous race mode).

---

## Session 15 — 2026-06-13

### Work Completed

- **Full pre-deploy project review** (no code, no gameplay, no deployment). Read all server/client/shared source, all docs, all 14 ADRs; searched for TODO/FIXME/HACK/NOT_IMPLEMENTED/@ts-ignore/any.
- Produced three review docs at the repo root: **`RELEASE_READINESS.md`** (assessment + findings + doc audit), **`MUST_FIX_BEFORE_DEPLOY.md`** (public-deploy blockers), **`NICE_TO_HAVE_AFTER_DEPLOY.md`** (post-launch backlog).
- **Fixed three stale documentation spots found during the review** (docs only): ARCHITECTURE header "Phases 1–4" → "1–7"; PROJECT_OVERVIEW status "Phase 4 (complete), 38 tests" → feature-complete through Phase 7, 64 tests; ADR-007 status "implementation lands Phase 6" → reflects Phase 2 + post-Phase-4.
- Added the three review docs to the START_HERE documentation index.

### Key findings (summary; details in RELEASE_READINESS.md)

- **No code debt markers**, no leftover stubs; 64 tests + typecheck/lint/build all green.
- **Must-fix before public deploy** (config + one safeguard, not features): set `CLIENT_ORIGIN` (CORS), set `VITE_SERVER_URL`/TLS for the client (wss), pin to a single instance (in-memory state), and guard unauthenticated room creation (DoS).
- **Known limitations (by design, ADR-002):** in-memory only, single-instance, no accounts/persistence, honor-system content.
- **Nice-to-have:** rate limiting, graceful shutdown, structured logging, client/handler tests, remove the dead `NOT_IMPLEMENTED` enum member, dictionary/profanity validation, accessibility.

### Next Recommended Action

If deploying: work through `MUST_FIX_BEFORE_DEPLOY.md`, then deploy per `docs/DEPLOYMENT.md`. Otherwise the game is complete for LAN/friends play; pick from `NICE_TO_HAVE_AFTER_DEPLOY.md` as desired.

---

## Session 16 — 2026-06-14

### Work Completed

- **Documentation organization** (docs only — no code/gameplay/deployment changes). Cleaned the repository root.
- Moved the three release-review docs from the root into `docs/` with `git mv` (history preserved): `RELEASE_READINESS.md`, `MUST_FIX_BEFORE_DEPLOY.md`, `NICE_TO_HAVE_AFTER_DEPLOY.md`. They are project artifacts, not entry points or tool-loaded files, so they don't belong at the root.
- **Root now holds four Markdown files, each with a reason:** `README.md` (GitHub landing page), `START_HERE.md` (universal entry point), `CLAUDE.md` (Claude Code auto-loads `./CLAUDE.md`), `CLAUDE_CONTEXT.md` (volatile session snapshot paired with `CLAUDE.md`; step 3 of the onboarding workflow).
- Updated all references: START_HERE doc-index rows now point to `docs/…`; the moved files' internal links de-prefixed (`docs/LOCAL_PLAYTESTING.md` → `LOCAL_PLAYTESTING.md`, `docs/DEPLOYMENT.md` → `DEPLOYMENT.md`); PROJECT_OVERVIEW's `../RELEASE_READINESS.md` → `RELEASE_READINESS.md`. Verified no broken `../` or `docs/` links remain.
- Added a **"Layout rule" table** to START_HERE §5 documenting why each root file stays at root (the documentation-structure summary).
- Left SESSION_NOTES' earlier (Session 15) mentions of these files as-is — they are append-only history and were accurate at the time.

### Documentation structure (after cleanup)

- **Root:** `README.md`, `START_HERE.md`, `CLAUDE.md`, `CLAUDE_CONTEXT.md`.
- **docs/:** `ARCHITECTURE.md`, `DECISIONS.md`, `DEPLOYMENT.md`, `GAME_RULES.md`, `LOCAL_PLAYTESTING.md`, `PROGRESS.md`, `PROJECT_OVERVIEW.md`, `ROADMAP.md`, `SESSION_NOTES.md`, `RELEASE_READINESS.md`, `MUST_FIX_BEFORE_DEPLOY.md`, `NICE_TO_HAVE_AFTER_DEPLOY.md`.

### Next Recommended Action

Unchanged from Session 15 — the game is feature-complete; deploy (work `docs/MUST_FIX_BEFORE_DEPLOY.md` first) or pick a Nice-to-Have.

---

## Session 17 — 2026-06-14

### Work Completed

- **Cut the v1.0.0 release** (first feature-complete release; Phases 0–7). No code/gameplay/deployment changes — release mechanics + docs only.
- Bumped all four workspace packages (root, `client`, `server`, `shared`) `0.1.0` → `1.0.0` via `npm version --no-git-tag-version --include-workspace-root --workspaces`; `package-lock.json` synced.
- Added root **`CHANGELOG.md`** with the v1.0.0 entry (highlights + engineering notes + known limitations); registered it in the START_HERE layout rule and doc index.
- Updated START_HERE status to "Released as v1.0.0" on `develop/v1`.
- Verified: format, typecheck, lint, 64 tests, builds — all green at 1.0.0.
- Tagged **`v1.0.0`** (annotated) on `develop/v1` after the release commit.

### Notes

- Release lives on branch `develop/v1`; `main` remains untouched.
- **Not pushed** — branch and tag are local; pushing to `origin` (and any GitHub Release) is the user's call (outward-facing). See the final message for the exact push commands.

### Next Recommended Action

Push `develop/v1` and the `v1.0.0` tag if/when ready, then work `docs/MUST_FIX_BEFORE_DEPLOY.md` before any public deploy.

---

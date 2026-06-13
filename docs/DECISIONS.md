# Architectural Decisions

> Record significant decisions here with rationale and trade-offs. Helps future sessions understand _why_ the code is the way it is.

---

## ADR-001 — Technology Stack

**Date:** 2026-06-13  
**Status:** Accepted

### Decision

Frontend: React + TypeScript + Vite (scaffolded as React 19 in Phase 1)  
Backend: Node.js + Express + Socket.IO + TypeScript

### Rationale

- React is the dominant UI library; component model maps naturally to game boards and keyboard widgets.
- Vite gives a fast dev server and clean TypeScript support out of the box.
- Socket.IO is the standard choice for real-time browser games; it handles WebSocket with graceful HTTP fallback and provides a room abstraction that fits game lobbies directly.
- TypeScript on both ends allows sharing type definitions (event payloads, game state), preventing protocol drift.

### Trade-offs

- Could have used plain WebSockets (smaller bundle) but Socket.IO's room/broadcast API saves meaningful boilerplate.
- Could have used Next.js for SSR, but this game has no SEO or initial-load content requirements; a pure SPA is simpler.

---

## ADR-002 — No Database at MVP

**Date:** 2026-06-13  
**Status:** Accepted

### Decision

Game state is held in-memory on the server. No database is used at MVP.

### Rationale

- Simplest path to a working game. Removes an entire infrastructure dependency.
- Games are ephemeral by nature — if the server restarts, in-flight games are lost, which is acceptable for a hobby project.
- A leaderboard or persistent stats would require a DB; that is deferred to a later phase.

### Trade-offs

- Server restart loses all active rooms.
- Cannot scale horizontally without a shared state store (e.g. Redis pub/sub). Acceptable at MVP with a single server instance.

### Upgrade Path

If persistence is needed later: add Redis for session storage and a Postgres DB for user accounts and scores.

---

## ADR-003 — Monorepo with npm Workspaces

**Date:** 2026-06-13  
**Status:** Accepted (implemented in Phase 1)

### Decision

Use a single repository with `npm workspaces`: `shared/`, `client/`, and `server/` as workspace packages.

### Rationale

- Keeps code collocated for a solo developer.
- Allows a `shared/` package for types used by both client and server without publishing to npm.
- Single `npm install` at the root installs all dependencies.

### Trade-offs

- Slightly more complex root `package.json`.
- Simpler alternative (two separate repos) would avoid workspace overhead but makes type sharing harder.

---

## ADR-004 — Turn-Based (Alternating) Guessing

**Date:** 2026-06-13 (resolved in Phase 1)  
**Status:** Accepted — turn-passing and loss rules amended by ADR-009

### Decision

Players alternate turns: one letter per turn, the turn passes after every guess regardless of correctness. First turn assigned randomly.

### Rationale

- The required socket contract (`turn_changed`) and gameplay docs assumed a turn model — turn-based is the design the event protocol was shaped around.
- Dramatically simpler win conditions: only one player acts at a time, so word-solved / hanged / forfeit always resolves unambiguously and **draws are impossible**. Simultaneous play needed tie-breakers (fewer wrong guesses, then elapsed time).
- Simpler server logic and simpler UI (one clear "your turn / their turn" state).

### Trade-offs

- The waiting player has dead time each turn. Mitigated by watching the opponent's board update live.
- Simultaneous "race mode" is more frantic and could return later as a game mode; the `GameView.activePlayerId` field would simply be `null` in that mode, so the protocol does not block it.

---

## ADR-005 — Tailwind CSS 4 for Styling

**Date:** 2026-06-13  
**Status:** Accepted

### Decision

Tailwind CSS v4 via the first-party `@tailwindcss/vite` plugin; a single `@import 'tailwindcss'` in `index.css`. No tailwind.config file unless customisation demands one.

### Rationale

- Utility classes keep styling collocated with the small number of game components; no naming/cascade overhead for a solo project.
- v4's Vite plugin needs zero config and builds only the classes used (10 kB CSS at skeleton stage).

### Trade-offs

- Markup is more verbose than CSS Modules. Accepted for development speed.

---

## ADR-006 — Source-Only `shared` Package

**Date:** 2026-06-13  
**Status:** Accepted

### Decision

`@dual-hangman/shared` ships raw TypeScript (`main`/`types` → `src/index.ts`) with **no build step**. Consumers compile it themselves: Vite (client) and `tsx` (server dev) handle TS on the fly; `tsup` bundles it into the production server file via `noExternal`.

### Rationale

- Zero build orchestration: no "rebuild shared before X" footgun after weeks away from the project — important for resumability.
- Type changes propagate instantly to both apps in dev.

### Trade-offs

- `shared` cannot be published to npm as-is (irrelevant — it is private).
- Every consumer must be able to compile TS (all current consumers can).
- Production server build must bundle it — encoded once in `server/tsup.config.ts`.

---

## ADR-007 — Reconnection via Token + Grace Period

**Date:** 2026-06-13  
**Status:** Accepted (lobby-level reconnection landed in Phase 2; in-game forfeit-on-grace-expiry in the post-Phase-4 fix)

### Decision

On room create/join the server issues `{ playerId, reconnectToken }`; the client persists them in `localStorage`. A disconnected player has `RECONNECT_GRACE_SECONDS` (60 s) to emit `reconnect_player` with valid credentials; the server then rebinds the socket and resyncs via `state_sync`. Grace expiry mid-game forfeits the round.

### Rationale

- Mobile browsers and flaky Wi-Fi make raw socket lifetime a bad identity; a token survives refreshes and network blips.
- A bounded grace period keeps the opponent from waiting forever, while forfeit (not draw) keeps the win conditions total.

### Trade-offs

- Tokens in `localStorage` are readable by any JS on the origin — acceptable for a game with no accounts or stakes.
- 60 s is a guess; tune after real play-testing.

---

## ADR-008 — Node.js 22.12+ Baseline

**Date:** 2026-06-13  
**Status:** Accepted

### Decision

Require Node ≥ 22.12 (`engines` in root package.json); develop on Node 24 LTS.

### Rationale

Node 18 (previous dev machine default) is end-of-life and below the minimum for Vite 7+/8 and Tailwind 4. Node 24 is the newest LTS (supported to 2028), which suits a project that may pause for long stretches.

---

## ADR-009 — Win by Reveal Only; Wrong Guesses Carry No Penalty

**Date:** 2026-06-13  
**Status:** Accepted (aligns the rules with the original game design; amends ADR-004)

### Decision

1. A **correct guess grants another immediate guess** — the turn continues until a wrong guess.
2. A **wrong guess ends the turn** and passes control to the opponent.
3. The **6-wrong-guess loss condition is removed**; `opponent_hanged` no longer exists as a game-over reason.
4. The **only gameplay win condition is fully revealing the opponent's word** (forfeit remains as a non-gameplay outcome).
5. Wrong guesses are still **counted for statistics/UI**, but cause no defeat or penalty.
6. The **hangman figure is cosmetic**: drawn only at game over, for the losing player.

### Rationale

- Matches the original game design intent: a race to solve, not a survival contest.
- Rewarding correct guesses with continued turns makes skill (good letter choices) directly pay off and keeps rounds fast.
- Removing elimination keeps both players in the game to the end — no dead time playing out a lost position.

### Trade-offs

- **Stronger first-turn advantage:** a player on a hot streak can solve the entire word in one turn. Accepted; the random first turn and word choice (picking hard words) are the counterweights. Revisit after play-testing if needed.
- Losing the hangman tension during play: the figure no longer looms as a threat. It returns as the loss visual, keeping the theme.
- `MAX_WRONG_GUESSES` removed from shared constants; `BoardView.maxWrongGuesses` removed; `GameOverReason` narrowed to `word_solved | opponent_forfeit`. Done before any gameplay logic existed, so no migration cost.

---

## ADR-010 — Lobby Sync via `reconnect_player`; Leave Reverts the Room

**Date:** 2026-06-13 (Phase 2)  
**Status:** Accepted

### Decision

1. **One sync path:** on lobby mount the client always emits `reconnect_player` with its stored identity and renders from the server's `state_sync` reply. The same path serves fresh navigation, page refresh, and socket auto-reconnects (the client re-emits on every `connect`).
2. **Leave reverts, not destroys:** when one of two players leaves (explicitly or by grace-timer expiry) during lobby phases, the room reverts to `waiting_for_opponent` and the remaining player gets a `state_sync` — the room code stays shareable. Only the last player out destroys the room.
3. Identity (`roomCode`, `playerId`, `reconnectToken`, `playerName`) persists in `localStorage`; it is cleared on explicit leave or a `RECONNECT_REJECTED` reply.

### Rationale

- A dedicated `get_state` event would duplicate what `reconnect_player` already does (validate identity → rebind → `state_sync`). One code path means refresh, navigation, and true reconnection cannot drift apart.
- Reverting instead of destroying keeps the lobby forgiving: the waiting player does not need to create a new room and re-share a code because their friend's browser crashed.

### Trade-offs

- `reconnect_player` is semantically overloaded (it is also the "give me my state" request). Accepted for protocol economy; rename to `resume_session` later if it confuses.
- During `playing`, leave/grace-expiry must forfeit (`game_won`) instead of reverting — deferred to Phase 6, marked as TODOs at both call sites.

---

## ADR-011 — Dedicated GamePage + Shared `useGame` Hook; Reveal Words at Game Over

**Date:** 2026-06-13 (Phase 4)  
**Status:** Accepted

### Decision

1. Gameplay lives on its own route `/game/:roomCode` (GamePage), separate from `/lobby/:roomCode`. A shared `useGame(roomCode)` hook owns the socket subscription and the latest `GameView` for both pages.
2. Navigation is phase-driven: LobbyPage navigates to the game once the synced phase reaches `playing`; GamePage bounces back to the lobby if it sees a pre-game phase. The two phase sets are disjoint, so there is no redirect loop.
3. `game_won` reveals each player their own target word via `GameView.opponentWordRevealed` — the loser finally sees the word they could not finish; the winner's board is already fully solved.

### Rationale

- A dedicated route matches the documented component hierarchy and keeps each page's render simple (lobby concerns vs board concerns).
- Extracting `useGame` removes duplication: both pages need the identical subscribe-and-resync-on-`connect` logic (ADR-010). One hook, one source of truth.
- Re-emitting `reconnect_player` on mount means navigating Lobby→Game — or a refresh that lands on the wrong route — always resyncs to authoritative state, so the brief unmount/remount can never strand the UI on stale data.

### Trade-offs

- Two routes for one session means a quick unmount/remount on game start; acceptable because the mount-time resync makes it stateless.
- Revealing the word at game over is arguably Phase 5 (result screen) territory, but the data belongs in `game_won`'s state and costs nothing. The polished result screen, hangman defeat figure, and rematch remain Phase 5.

---

## ADR-012 — Rematch as Mutual Opt-In; Reveal Both Words at Game Over

**Date:** 2026-06-13 (Phase 5)  
**Status:** Accepted

### Decision

1. A rematch requires **both** players to opt in — the same mutual-readiness model as word submission. `request_rematch` sets a per-player `wantsRematch` flag; the first to ask notifies the opponent (`rematch_requested`) and waits; when both have asked, the room is reset to `word_setup` and both get `rematch_started`.
2. A rematch **reuses the existing room and the word-setup flow** rather than introducing a new phase: `resetForRematch` clears words/flags/game and sets phase `word_setup`, so the entire Phase 3 path (and a fresh random first turn) is reused unchanged.
3. **Declining is leaving.** There is no separate "decline" event: a player who doesn't want a rematch leaves (`leave_room`), which reverts the room to `waiting_for_opponent` and returns the other player to the lobby via `state_sync`.
4. If a player requests a rematch when the opponent has already gone, the server replies `rematch_unavailable` and reverts the requester to the lobby (removing the absent opponent).
5. At `game_over`, **both** secret words are revealed to each player (`yourWordRevealed` + `opponentWordRevealed`), sourced from `ServerPlayer.secretWord`.

### Rationale

- Mutual opt-in avoids yanking a player into a new round they didn't agree to, and mirrors a model already proven in word setup — minimal new concepts.
- Reusing `word_setup` keeps the state machine small: no bespoke "rematch" phase, and the client's existing lobby/word-setup screens handle the new round for free.
- Folding "decline" into "leave" avoids a near-duplicate event; the lobby-revert behavior already produces the desired "return to lobby" outcome.

### Trade-offs

- A rematch always re-collects secret words (no "same words again" shortcut). Intentional — re-using words would leak information.
- The loser of a forfeit can't be offered a rematch (they're gone); the winner simply returns to the lobby. Acceptable.

---

## ADR-013 — Sound Effects via Web Audio Synthesis

**Date:** 2026-06-13 (Phase 6 — deferred optional item)
**Status:** Accepted

### Decision

Synthesize the six effects (correct, wrong, your-turn, opponent-joined, won, lost) procedurally with the Web Audio API instead of shipping audio files. The `AudioContext` is created/resumed on the first user gesture (autoplay policy); until then `playSound` is silently skipped. A mute toggle persists in `localStorage` (default: on). Tones are short and low-volume — no music, and no sound on every button click or key press.

### Rationale

- Zero binary assets: a tiny footprint, nothing extra to host or cache-bust, and pitch/length are trivial to tune in code.
- Web Audio gain envelopes make "subtle and short" easy and click-free.
- Client-only — the server and gameplay logic are untouched. Sounds are side effects fired from `useGame`'s existing event handlers.

### Trade-offs

- Synth tones are less rich than designed samples; acceptable for subtle cues, and samples can be swapped in later behind the same `playSound()` API.
- Trigger choices keep it from getting noisy: correct/wrong play only for the local player's own guess, your-turn on acquiring the turn, opponent-joined for the host, won/lost per outcome.

---

## ADR-014 — Session Score on the Room (In-Memory)

**Date:** 2026-06-13 (Phase 7)
**Status:** Accepted

### Decision

Each `ServerPlayer` carries a `score` (rounds won). The winner of a round gets +1 via `RoomManager.recordRoundResult(room)`, called once per round end — from `forfeit` (opponent_forfeit) and from the guess handler on a solve (word_solved). `GameView` exposes `yourScore` / `opponentScore`. The score persists across rematches (`resetForRematch` leaves it untouched) and dies with the room; when a player leaves and the room reverts to waiting, the survivor's score is reset so a new opponent starts a fresh 0–0.

### Rationale

- Score is just per-pairing session state, so it belongs with the in-memory room (ADR-002) — no DB, no accounts, no history.
- Putting it on `ServerPlayer` makes "persists across rematch / resets with the room" fall out for free: the players survive `resetForRematch` but not room destruction.
- One `recordRoundResult` method keeps both win paths consistent and unit-testable.

### Trade-offs

- A server restart loses scores (same as all room state — accepted, ADR-002).
- Resetting the survivor's score on re-pairing is a judgement call (the requirement only specified reset-on-destroy); a running tally against a brand-new opponent would be misleading, so a fresh pairing starts fresh.
- No best-of-N / match length — explicitly out of scope for Phase 7.

---

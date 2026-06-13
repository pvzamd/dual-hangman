# Nice to Have After Deploy

> Non-blocking improvements — quality, hardening, and optional features. None are required to ship (see [MUST_FIX_BEFORE_DEPLOY.md](MUST_FIX_BEFORE_DEPLOY.md) for blockers). Full context in [RELEASE_READINESS.md](RELEASE_READINESS.md).

## Hardening & resilience

- **Rate-limit socket events** (`guess_letter`, `chat_message`, `reconnect_player`, `join_room`) per connection — prevents chat spam and connection churn. (If room-creation throttling wasn't done as a must-fix, fold it in here.)
- **Graceful shutdown** — on SIGTERM, stop accepting connections and let the platform drain; in-memory games still drop (ADR-002), but it avoids abrupt cut-offs mid-deploy.
- **Structured logging + levels** — replace ad-hoc `console.log` with a leveled logger; drop the per-connection noise in production.
- **Join-by-code enumeration** — optionally rate-limit `join_room` failures so the short room-code space can't be scanned for open rooms.

## Testing & quality

- **Client tests** — add Vitest + React Testing Library to the client; cover `useGame` reducers/handlers and the key components (Keyboard disable logic, TurnIndicator states, GameChat).
- **Handler/integration tests** — promote the manual socket smoke tests into automated tests (e.g. spin up the Socket.IO server in-memory and assert event flows for join, guess streak, forfeit, rematch, score).
- **Sound** — currently unverifiable in CI (Web Audio needs a browser); keep a manual playtest step, or add a thin mock around `playSound` to assert it's _called_ on the right events.

## Small cleanups

- Remove the unused `'NOT_IMPLEMENTED'` member from the `ErrorCode` union (`shared/src/types.ts`) — no longer emitted.
- Make `RECONNECT_GRACE_SECONDS` parsing tolerate `0` and reject negatives (use an explicit `Number.isFinite` + `>= 0` check instead of `|| default`).

## Content & UX

- **Dictionary validation** of secret words (reject non-words) and/or a basic profanity filter for words and chat — currently honor-system.
- **Accessibility pass** — keyboard navigation for the on-screen keyboard, ARIA on the boards, focus management between phases.
- **Reduced dead time** — a small "opponent is typing/guessing" hint, or surfacing the opponent's last guess more prominently.

## Optional features (from the roadmap "Nice-to-Have / Future")

- Simultaneous **"race mode"** (the `GameView.activePlayerId: null` path is already reserved — see ADR-004).
- **Spectator mode**; **PWA/installable**; word **categories/difficulty**.
- **Best-of-N** match length (deliberately omitted in Phase 7).
- Anything requiring persistence (accounts, leaderboards, match history, stats) would first need a database and reverses ADR-002 — treat as a separate, larger initiative.

---

_Triage suggestion: do the **hardening** group first if traffic grows, then **testing** to lock in confidence, then pick UX/feature items by interest. Re-evaluate ADR-002 (in-memory, single-instance) only if real usage demands multi-instance scaling or persistence._

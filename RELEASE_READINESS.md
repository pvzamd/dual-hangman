# Release Readiness Review

> Full project review at the end of the planned roadmap (Phases 0–7 complete).
> Scope: assessment only — no features, no gameplay changes, no deployment.
> Date: 2026-06-13. Reviewer: AI session (see SESSION_NOTES Session 15).
>
> Companion docs: **[MUST_FIX_BEFORE_DEPLOY.md](MUST_FIX_BEFORE_DEPLOY.md)** (blockers) and **[NICE_TO_HAVE_AFTER_DEPLOY.md](NICE_TO_HAVE_AFTER_DEPLOY.md)** (post-launch).

## Verdict

**Functionally complete and solid for its intended use (a hobby game played over LAN or shared with friends).** The full loop works end-to-end and is well-tested at the unit level, with clean server-authoritative architecture and thorough documentation.

**Not yet ready for an unattended public internet deployment** without the handful of items in MUST_FIX_BEFORE_DEPLOY.md — chiefly production CORS/URL/TLS configuration, the single-instance constraint, and unauthenticated room-creation (DoS) exposure. None require new features; they are configuration and a small safeguard.

## What was reviewed

- All server source (`server/src/**`), client source (`client/src/**`), and shared contract (`shared/src/**`).
- All eight docs in `docs/`, plus `START_HERE.md`, `README.md`, `CLAUDE_CONTEXT.md`, `CLAUDE.md`.
- All 14 ADRs in `docs/DECISIONS.md`.
- Test suite (`npm run test`) and tooling (`typecheck`, `lint`, `build`).
- Searched the codebase for `TODO`/`FIXME`/`HACK`/`NOT_IMPLEMENTED`/`@ts-ignore`/`any`.

## Current state (verified)

- **Tests:** 64 Vitest tests across 4 files (server only), all passing. typecheck, lint, build all clean.
- **Code debt markers:** none. No `TODO`/`FIXME`/`HACK` remain in source; no `@ts-ignore`; no stray `any`; all socket events are implemented (no `NOT_IMPLEMENTED` handler stubs left).
- **Architecture:** server-authoritative; the opponent's unsolved word never leaves the server; the typed socket contract (`shared/src/events.ts`) is shared by both sides.

## Findings

### A. Technical debt (low)

1. **Dead enum member** — `ErrorCode` still includes `'NOT_IMPLEMENTED'` (`shared/src/types.ts`), no longer emitted anywhere. Harmless; remove in a cleanup. (NICE_TO_HAVE)
2. **No client-side tests** — the client (React components, `useGame`, sound) has no test runner. All 64 tests are server/shared. Socket _handlers_ are covered only by manual smoke tests during development, not automated integration tests. (NICE_TO_HAVE)
3. **Verbose logging** — `console.log` on every connect/disconnect/disconnect-reason; no log levels or structured logging. Fine for dev, noisy in prod. (NICE_TO_HAVE)
4. **Grace env edge** — `Number(process.env.RECONNECT_GRACE_SECONDS) || 60` means `0` can't be configured (falls back to 60) and a negative value would fire the timer immediately. Operator-only edge. (NICE_TO_HAVE)

### B. Known limitations (by design — see ADR-002)

1. **In-memory state only.** A server restart drops all active rooms, games, and scores. Accepted for a hobby project.
2. **Single instance only.** No shared store (Redis), so the server cannot be horizontally scaled or run with multiple replicas — Socket.IO rooms and `RoomManager` live in one process's memory. A deploy must pin to **one instance / no autoscaling**.
3. **No accounts/persistence/history** — no DB, logins, profiles, leaderboards, or match history. Scores are per-room and ephemeral (ADR-014).
4. **Honor-system content** — secret words are validated only for length/charset (A–Z), not against a dictionary or profanity list; chat is unfiltered. Fine among friends.

### C. Risks & edge cases

1. **Unauthenticated room creation (DoS).** `create_room` has no rate limit and there's no cap on the number of rooms; a script could create rooms until the single instance runs out of memory. The idle sweep only reclaims after `ROOM_IDLE_TIMEOUT_MINUTES` (30 min). **Material risk for a public deploy** → MUST_FIX (mitigate before public exposure).
2. **No rate limiting on any socket event** — `guess_letter`, `chat_message`, `reconnect_player`, etc. can be spammed. Gameplay stays correct (server validates every guess), but chat spam and connection churn are possible. (NICE_TO_HAVE)
3. **Short room codes are enumerable.** 5 chars from a 31-char alphabet (~28.6M combos); `join_room` distinguishes not-found / full / wrong-phase, so a scanner could find and join an open `waiting_for_opponent` room. Low impact (rooms are short-lived, only joinable while waiting), but worth noting. (NICE_TO_HAVE)
4. **XSS surface is covered, by reliance on React escaping.** Names and chat text are arbitrary (length-capped) strings rendered as React text nodes, which React escapes — so there is no stored XSS today. Any future switch to `dangerouslySetInnerHTML` or non-React rendering would reopen this. (note)
5. **Reconnect tokens in `localStorage`** (ADR-007) are readable by any script on the origin. Acceptable for a game with no accounts/stakes.
6. **Clipboard copy-code** silently no-ops over plain-LAN `http` (clipboard API needs a secure context). Already handled gracefully; the code is shown for manual copy.

### D. ADR / documentation review

- **14 ADRs reviewed; internally consistent.** ADR-004 is correctly marked amended by ADR-009; the win-by-reveal rules match GAME_RULES.md and the code.
- **Three stale doc spots found and corrected in this review** (documentation only):
  - `docs/ARCHITECTURE.md` header said "Phases 1–4 implemented" → now 1–7.
  - `docs/PROJECT_OVERVIEW.md` "Current Status" said "Phase 4 — Core Gameplay (complete)" with 38 tests → now feature-complete through Phase 7, 64 tests.
  - ADR-007 status said "implementation lands Phase 6" → now reflects Phase 2 (lobby reconnection) + post-Phase-4 (forfeit).
- No contradictions remain between GAME_RULES, ARCHITECTURE, the ADRs, and the code as of this review.

## Test & quality gate

| Gate                   | Status                           |
| ---------------------- | -------------------------------- |
| `npm run typecheck`    | ✅ clean (all workspaces)        |
| `npm run lint`         | ✅ clean (ESLint 10 flat config) |
| `npm run test`         | ✅ 64 passed                     |
| `npm run build`        | ✅ client + server build         |
| TODO/FIXME/dead stubs  | ✅ none                          |
| ADR/doc contradictions | ✅ none (3 fixed here)           |

## Bottom line

Ship it to **friends/LAN** as-is. Before a **public, unattended** deployment, clear MUST_FIX_BEFORE_DEPLOY.md (mostly config + one DoS safeguard), then schedule NICE_TO_HAVE_AFTER_DEPLOY.md items as time allows.

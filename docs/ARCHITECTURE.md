# Architecture

> Phases 1–7 implemented (scaffolding → lobby → word setup → core gameplay → game over + rematch → polish & resilience → scoring). The socket contract here mirrors `shared/src/events.ts` — that file is the compile-time truth; keep this document in sync with it.

## High-Level Overview

```
Browser (Player A)          Browser (Player B)
       │                           │
       │  WebSocket (Socket.IO)    │
       └──────────┬────────────────┘
                  │
          ┌───────▼─────────┐
          │ Node / Express  │
          │ + Socket.IO     │
          └───────┬─────────┘
                  │  In-memory room state
                  │  (no DB at MVP — ADR-002)
                  └─ (future: Redis or DB)
```

The server is authoritative: clients never hold the opponent's secret word and all rule enforcement happens server-side.

## Monorepo Layout

npm workspaces with three packages:

```
dual-hangman/
├── shared/                  @dual-hangman/shared — types only, no build step
│   └── src/
│       ├── constants.ts     ← word length limits, room code charset, reconnect grace
│       ├── types.ts         ← GameView, BoardView, PlayerInfo, RoomPhase, ErrorCode
│       ├── events.ts        ← ClientToServerEvents / ServerToClientEvents contract
│       ├── words.ts         ← normalizeSecretWord (one validation source for both sides)
│       └── index.ts
├── client/                  @dual-hangman/client — React SPA
│   ├── public/
│   └── src/
│       ├── pages/           ← Home, CreateRoom, JoinRoom, Lobby, Game (all wired)
│       ├── components/      ← WordSetupForm, GameBoard, TurnIndicator, WordDisplay, GuessedLetters, Keyboard, HangmanFigure, GameChat, SoundToggle
│       ├── hooks/useGame.ts ← socket subscription + GameView + rematch + chat; fires sound cues
│       ├── lib/identity.ts  ← localStorage identity persistence (ADR-010)
│       ├── lib/sound.ts     ← Web Audio sound effects + mute setting (ADR-013)
│       ├── socket.ts        ← typed Socket.IO client singleton
│       ├── App.tsx          ← routes
│       ├── main.tsx         ← entry
│       └── index.css        ← Tailwind entry + subtle keyframes (reveal, fadeIn)
├── server/                  @dual-hangman/server — Node backend
│   └── src/
│       ├── index.ts                         ← Express + Socket.IO bootstrap, /health, idle-room sweep interval
│       ├── socket/types.ts                  ← GameServer/GameSocket generics + SocketData
│       ├── socket/registerSocketHandlers.ts ← all events live: lobby, word, guess, forfeit, rematch, chat
│       ├── rooms/RoomManager.ts             ← rooms, join/leave/forfeit/rematch, reconnect, grace timers, idle sweep
│       ├── rooms/roomView.ts                ← Room → client-safe GameView projection
│       ├── game/GameManager.ts              ← round state + guessLetter + forfeit (turn rules, win detection)
│       │                                       (RoomManager.recordRoundResult awards the session point)
│       └── *.test.ts                        ← Vitest unit tests beside the code they cover
└── docs/
```

**How `shared` is consumed:** it is a source-only package (`main`/`types` point at `src/index.ts`). Vite and `tsx` compile the TS source on the fly in dev; for the production server build, `tsup` bundles it into `server/dist/index.js` (`noExternal` in `tsup.config.ts`). There is deliberately no build step for `shared` — see ADR-006.

## Frontend

- **Stack:** React 19, TypeScript, Vite, Tailwind CSS 4 (via `@tailwindcss/vite`), react-router-dom 7.
- **Routes:** `/` (home), `/create`, `/join`, `/lobby/:roomCode` (waiting + word setup), `/game/:roomCode` (play + game over).
- **Socket client:** `src/socket.ts` exports one `Socket<ServerToClientEvents, ClientToServerEvents>` singleton with `autoConnect: false`; flows that need the server call `socket.connect()`.
- **State management:** the `useGame(roomCode)` hook owns the socket subscription and the latest `GameView`; LobbyPage and GamePage both consume it. The server's full-state payloads (`state_sync`, `game_started.state`, `guess_result.state`, `game_won.state`) keep client state a pure projection — **no rule logic on the client**. LobbyPage navigates to `/game/:roomCode` once the synced phase reaches `playing`; GamePage bounces back if it sees a pre-game phase, so the two never show the wrong screen (even after a refresh mid-game).

## Backend

- **Stack:** Node.js ≥ 22.12 (developed on 24), Express 5, Socket.IO 4, TypeScript.
- **Dev workflow:** `tsx watch src/index.ts` (restart on change). **Build:** `tsup` → single ESM file `dist/index.js`. **Run:** `node dist/index.js`.
- **HTTP surface:** `GET /health` → `{ "status": "ok" }`. Everything else is Socket.IO.
- **Env:** `PORT` (default 3001); `CLIENT_ORIGIN` locks CORS in production, and when unset reflects the request origin so local/LAN devices connect without config (see `docs/LOCAL_PLAYTESTING.md`). The HTTP server binds all interfaces, so it is reachable at `http://<host-ip>:PORT` on the LAN.

### Server-side models

`ServerPlayer` (in `RoomManager.ts`) is the authoritative player record:

| Field            | Notes                                                      |
| ---------------- | ---------------------------------------------------------- |
| `id`             | UUID, stable across reconnections                          |
| `name`           | Display name                                               |
| `socketId`       | Current socket, `null` while disconnected                  |
| `reconnectToken` | Random secret issued at join; proves identity on reconnect |
| `connected`      | Drives `opponent_disconnected` / grace timer               |
| `secretWord`     | **Never leaves the server** until game over reveals it     |

`Room` holds `code`, `phase`, `players[]`, a `GameManager` once playing, and activity timestamps for idle cleanup.

The shared `PlayerInfo` / `GameView` types are the _client-safe projections_ of these records.

## Room Lifecycle

```
create_room ──► waiting_for_opponent
                     │ join_room (2nd player)
                     ▼
                word_setup ◄────────────────┐
                     │ both submit_secret_word │ rematch (Phase 5)
                     ▼                       │
                 playing                     │
                     │ word solved / forfeit │
                     ▼                       │
                 game_over ──────────────────┘
```

A room is destroyed when: both players leave, the waiting host disconnects past the grace period, or it sits idle longer than `ROOM_IDLE_TIMEOUT_MINUTES` (sweep implemented in Phase 6).

## Turn Model

Turn-based with streaks (ADR-004, revised by ADR-009). The first turn is assigned randomly when the round starts. The active player guesses one letter:

- **Correct** → the player keeps the turn and guesses again immediately (`turn_changed` is NOT emitted).
- **Wrong** → recorded for statistics only, and the turn passes to the opponent (`turn_changed` emitted).

The server rejects out-of-turn guesses with `NOT_YOUR_TURN` and repeat guesses with `ALREADY_GUESSED` (a rejected repeat does not end the turn).

## Win Conditions

Evaluated server-side after every guess:

1. **word_solved** — the guess revealed the last hidden letter of the opponent's word → guesser wins. **This is the only gameplay win condition.**
2. **opponent_forfeit** — a player leaves or fails to reconnect within the grace period → remaining player wins.

There is **no loss by wrong guesses** (ADR-009): `wrongGuesses` in `BoardView` is statistics/UI data, and the hangman figure is a cosmetic visual drawn only for the loser at game over. A draw remains impossible — letters never repeat against the same word, so every turn permanently consumes at least one of 26 letters until someone's word is fully revealed.

## Socket Event Contract

Compile-time truth: `shared/src/events.ts`. Both sides instantiate Socket.IO with these generics, so emits and handlers are type-checked everywhere.

### Client → Server

| Event                | Payload                                  | Phase |
| -------------------- | ---------------------------------------- | ----- |
| `create_room`        | `{ playerName }`                         | 2     |
| `join_room`          | `{ roomCode, playerName }`               | 2     |
| `submit_secret_word` | `{ word }`                               | 3     |
| `guess_letter`       | `{ letter }`                             | 4     |
| `reconnect_player`   | `{ roomCode, playerId, reconnectToken }` | 6     |
| `leave_room`         | —                                        | 2     |
| `request_rematch`    | —                                        | 5     |
| `chat_message`       | `{ text }`                               | 6     |

### Server → Client

| Event                   | Payload                                            | Meaning                                           |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------- |
| `room_created`          | `{ roomCode, playerId, reconnectToken }`           | Room ready; show lobby                            |
| `room_joined`           | `{ roomCode, playerId, reconnectToken, opponent }` | Join confirmed (to joiner)                        |
| `opponent_joined`       | `{ opponent }`                                     | Second player arrived (to host)                   |
| `word_setup_started`    | —                                                  | Show secret-word form                             |
| `opponent_word_ready`   | —                                                  | Opponent locked in (word not sent)                |
| `game_started`          | `{ state }`                                        | Round begins; includes first turn                 |
| `guess_result`          | `{ guesserId, letter, correct, state }`            | Outcome of a guess + full refreshed state         |
| `turn_changed`          | `{ activePlayerId }`                               | Whose turn it is now                              |
| `game_won`              | `{ winnerId, reason, state }`                      | Round over; state reveals both words              |
| `rematch_requested`     | —                                                  | Opponent offered a rematch                        |
| `rematch_started`       | `{ state }`                                        | Both opted in; fresh round (state in word_setup)  |
| `rematch_unavailable`   | —                                                  | Opponent left; reverting to lobby via state_sync  |
| `opponent_disconnected` | `{ graceSeconds }`                                 | Grace timer started                               |
| `opponent_reconnected`  | —                                                  | Opponent came back                                |
| `state_sync`            | `{ state }`                                        | Full resync (after reconnect / phase transitions) |
| `chat_message`          | `{ senderId, senderName, text }`                   | Chat broadcast                                    |
| `error_occurred`        | `{ code, message }`                                | Typed error (`ErrorCode` union in `types.ts`)     |

## Game State Model

Clients only ever receive `GameView` — a per-player projection built by `buildRoomView(room, playerId)` (which delegates board fields to the room's `GameManager` once playing):

- `yourWordReady` / `opponentWordReady` — word-setup ready flags, so a refresh during setup restores the right screen.
- `yourScore` / `opponentScore` — running session score (rounds won), persists across rematches (ADR-014).
- `yourBoard` — your progress guessing the **opponent's** word (`maskedWord` hides unrevealed letters as `null`).
- `opponentBoard` — the opponent's progress guessing **your** word.
- `activePlayerId`, `winnerId`, `gameOverReason`; and `yourWordRevealed` + `opponentWordRevealed` — **both** secret words, populated only at game over.

### Word setup flow (Phase 3)

1. Client validates inline with the shared `normalizeSecretWord`, then emits `submit_secret_word`.
2. Server re-validates authoritatively (`INVALID_WORD` / `INVALID_PHASE` on failure), stores the word uppercase on `ServerPlayer.secretWord`. Re-submitting before the round starts overwrites.
3. First submission notifies the opponent (`opponent_word_ready`); every accepted submission acks the submitter with `state_sync`.
4. When both words are in: a `GameManager` is constructed (boards over each other's words, random first turn via `crypto.randomInt`), phase flips to `playing`, and each player receives a **personalized** `game_started`.

### Guessing flow (Phase 4)

1. Client emits `guess_letter { letter }`. The on-screen keyboard already disables guessed letters and disables itself off-turn, but the server is the authority.
2. `GameManager.guessLetter` validates and applies the guess, returning a discriminated outcome. Rejections (`NOT_YOUR_TURN`, `ALREADY_GUESSED`, `INVALID_LETTER`, `INVALID_PHASE`) leave all state untouched and surface as `error_occurred`.
3. **Correct:** every occurrence of the letter is revealed and the **same player keeps the turn** (streak). **Wrong:** `wrongGuesses` increments (stats only) and the turn passes.
4. If the guess revealed the last hidden letter → `winnerId`/`word_solved` set, phase flips to `game_over`, and both players get a personalized `game_won` (whose state reveals **both** secret words via `yourWordRevealed` + `opponentWordRevealed`).
5. Otherwise the server emits a personalized `guess_result` to each player, plus `turn_changed` to the room **only when the turn passed** (wrong guess). The client re-renders purely from the `state` in these payloads.

**Anti-cheat invariant:** the opponent's unsolved word never appears in any payload. Guess validation, turn order, and win detection are exclusively server-side; the masked board exposes only revealed letters until game over.

### Game over & rematch flow (Phase 5)

At `game_over` the result screen shows the win/lose/forfeit banner, **both** revealed words, a cosmetic hangman figure for the loser, and rematch controls.

1. A player emits `request_rematch`. `RoomManager.requestRematch` is valid only at `game_over` and uses the same mutual opt-in as word submission.
2. First requester → the opponent gets `rematch_requested` (their button becomes "Accept rematch"); the requester waits.
3. Both opted in → `resetForRematch` clears words/flags/game and sets phase `word_setup`; both clients get `rematch_started` (state in word_setup) and navigate back to the lobby for a new round (turn re-randomised when both resubmit).
4. If the opponent has already left, the requester gets `rematch_unavailable` and the room is reverted to `waiting_for_opponent` (the absent opponent removed), so a `state_sync` returns them to the lobby. Declining is just leaving — the remaining player reverts to the lobby the same way.

### Chat & idle cleanup (Phase 6)

- **Chat:** `chat_message { text }` is validated server-side with the shared `normalizeChatText` (trim, drop empty, cap at `MAX_CHAT_LENGTH`) and broadcast to the whole room as `chat_message { senderId, senderName, text }`. It is **ephemeral** — never stored (ADR-002); clients accumulate it in component state only. `lastActivityAt` is bumped on chat.
- **Idle sweep:** `index.ts` runs `RoomManager.sweepIdleRooms()` on a 60-second `unref()`'d interval. Any room whose `lastActivityAt` is older than `ROOM_IDLE_TIMEOUT_MINUTES` is removed (clearing its grace timers), reclaiming memory from abandoned rooms — including the "ghost" a forfeit leaves behind. Active play keeps a room alive because every meaningful action bumps `lastActivityAt`.
- **Sound (client-only, ADR-013):** `lib/sound.ts` synthesizes six short cues with the Web Audio API (no asset files). `useGame` fires them from existing event handlers — correct/wrong for your own guess, your-turn on acquiring the turn, opponent-joined for the host, won/lost per outcome. The audio context unlocks on the first user gesture (`App` listener) to satisfy autoplay rules; a `SoundToggle` mutes/unmutes (persisted in `localStorage`). The server and gameplay are untouched.

## Reconnection Strategy (lobby-level implemented in Phase 2)

1. `room_created` / `room_joined` give the client `{ roomCode, playerId, reconnectToken }`; the client persists them in `localStorage` (`client/src/lib/identity.ts`).
2. On disconnect, the server marks the player `connected: false`, starts a `RECONNECT_GRACE_SECONDS` (60s) timer, and notifies the opponent (`opponent_disconnected`).
3. The reconnecting client emits `reconnect_player` with its stored credentials. The server validates the token, rebinds the new socket, cancels the timer, replies with `state_sync`, and notifies the opponent (`opponent_reconnected`).
4. The lobby page uses the **same path as its mount-time sync** (ADR-010): it emits `reconnect_player` on every socket `connect`, so refresh, navigation, and transient drops all converge on `state_sync`.
5. A player leaving — explicit `leave_room` or grace-timer expiry — is handled by `handleExit`, which branches on phase: **during `playing` it forfeits** (the opponent immediately wins via `game_won` with `opponent_forfeit`, room → `game_over`, forfeiter kept in the room but marked disconnected so the winner's view still renders both boards); in any other phase it keeps the lobby behavior (revert to `waiting_for_opponent`, or destroy when empty). The grace window is `RECONNECT_GRACE_SECONDS` (env-overridable, default 60).

Game state lives only in server memory, so a **server** restart still ends all games (accepted — ADR-002).

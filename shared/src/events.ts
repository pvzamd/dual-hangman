/**
 * The strongly typed Socket.IO contract.
 *
 * These two interfaces are passed as generics to both the server
 * (`new Server<ClientToServerEvents, ServerToClientEvents>`) and the client
 * (`io<ServerToClientEvents, ClientToServerEvents>`), so every emit and
 * handler is compile-time checked on both sides.
 *
 * Documented in docs/ARCHITECTURE.md — keep the two in sync.
 */

import type { ErrorCode, GameOverReason, GameView, PlayerId, PlayerInfo } from './types.js';

// ---------- Client → Server payloads ----------

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface SubmitSecretWordPayload {
  word: string;
}

export interface GuessLetterPayload {
  letter: string;
}

export interface ReconnectPlayerPayload {
  roomCode: string;
  playerId: PlayerId;
  /** Issued in room_created / room_joined; proves identity across connections. */
  reconnectToken: string;
}

export interface ChatMessagePayload {
  text: string;
}

// ---------- Server → Client payloads ----------

export interface RoomCreatedPayload {
  roomCode: string;
  playerId: PlayerId;
  reconnectToken: string;
}

export interface RoomJoinedPayload {
  roomCode: string;
  playerId: PlayerId;
  reconnectToken: string;
  opponent: PlayerInfo;
}

export interface OpponentJoinedPayload {
  opponent: PlayerInfo;
}

export interface GameStartedPayload {
  state: GameView;
}

export interface GuessResultPayload {
  guesserId: PlayerId;
  letter: string;
  correct: boolean;
  /** Full per-player state after the guess — single source of truth for the UI. */
  state: GameView;
}

export interface TurnChangedPayload {
  activePlayerId: PlayerId;
}

export interface GameWonPayload {
  winnerId: PlayerId;
  reason: GameOverReason;
  /** Final state including `opponentWordRevealed`. */
  state: GameView;
}

export interface OpponentDisconnectedPayload {
  graceSeconds: number;
}

export interface StateSyncPayload {
  state: GameView;
}

export interface ChatBroadcastPayload {
  senderId: PlayerId;
  senderName: string;
  text: string;
}

export interface ErrorPayload {
  code: ErrorCode;
  message: string;
}

// ---------- The contract ----------

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomPayload) => void;
  join_room: (payload: JoinRoomPayload) => void;
  submit_secret_word: (payload: SubmitSecretWordPayload) => void;
  guess_letter: (payload: GuessLetterPayload) => void;
  reconnect_player: (payload: ReconnectPlayerPayload) => void;
  leave_room: () => void;
  /** After game_over, ask to play again with the same opponent (mutual opt-in). */
  request_rematch: () => void;
  chat_message: (payload: ChatMessagePayload) => void;
}

export interface ServerToClientEvents {
  room_created: (payload: RoomCreatedPayload) => void;
  room_joined: (payload: RoomJoinedPayload) => void;
  opponent_joined: (payload: OpponentJoinedPayload) => void;
  /** Both players present — clients should show the secret-word form. */
  word_setup_started: () => void;
  /** Opponent locked in their word (the word itself is never sent). */
  opponent_word_ready: () => void;
  game_started: (payload: GameStartedPayload) => void;
  guess_result: (payload: GuessResultPayload) => void;
  turn_changed: (payload: TurnChangedPayload) => void;
  game_won: (payload: GameWonPayload) => void;
  /** The opponent has requested a rematch (this client may accept by requesting too). */
  rematch_requested: () => void;
  /** Both players opted in — a fresh round begins; state is back in word_setup. */
  rematch_started: (payload: StateSyncPayload) => void;
  /** Rematch can't proceed (opponent left); the room reverts to the lobby via state_sync. */
  rematch_unavailable: () => void;
  opponent_disconnected: (payload: OpponentDisconnectedPayload) => void;
  opponent_reconnected: () => void;
  /** Full resync — sent after reconnection and on any phase transition. */
  state_sync: (payload: StateSyncPayload) => void;
  chat_message: (payload: ChatBroadcastPayload) => void;
  error_occurred: (payload: ErrorPayload) => void;
}

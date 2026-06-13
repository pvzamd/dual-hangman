/**
 * Game state models shared between client and server.
 *
 * Cheating-prevention rule: the server NEVER sends a player the opponent's
 * unsolved secret word. Clients only ever receive `GameView`, a per-player
 * projection of the authoritative server-side room state.
 */

export type PlayerId = string;

export type RoomPhase =
  /** Room created, waiting for a second player to join. */
  | 'waiting_for_opponent'
  /** Both players present; each is privately submitting a secret word. */
  | 'word_setup'
  /** Round in progress, players alternate guesses. */
  | 'playing'
  /** Round finished; winner/reason populated. */
  | 'game_over';

export type GameOverReason =
  /** Winner revealed every letter of the opponent's word — the only gameplay win. */
  | 'word_solved'
  /** Opponent left or failed to reconnect within the grace period. */
  | 'opponent_forfeit';

/** Public player identity — safe to send to either client. */
export interface PlayerInfo {
  id: PlayerId;
  name: string;
  connected: boolean;
}

/**
 * One board: a player's progress guessing one secret word.
 * `maskedWord` hides unrevealed letters as null, e.g. ['H', null, null, 'L', 'O'].
 * `wrongGuesses` is statistics/UI only — wrong guesses carry no gameplay
 * penalty and cannot cause defeat (ADR-009).
 */
export interface BoardView {
  maskedWord: (string | null)[];
  guessedLetters: string[];
  wrongGuesses: number;
  solved: boolean;
}

/**
 * Per-player projection of room state — everything one client may know.
 * `yourBoard` is the board where YOU guess the opponent's word;
 * `opponentBoard` mirrors the opponent's progress on YOUR word.
 * Boards are null until the round starts.
 */
export interface GameView {
  roomCode: string;
  phase: RoomPhase;
  you: PlayerInfo;
  opponent: PlayerInfo | null;
  /** Word-setup ready flags — true once that side's secret word is stored. */
  yourWordReady: boolean;
  opponentWordReady: boolean;
  yourBoard: BoardView | null;
  opponentBoard: BoardView | null;
  /** Whose turn it is; null outside the `playing` phase. */
  activePlayerId: PlayerId | null;
  winnerId: PlayerId | null;
  gameOverReason: GameOverReason | null;
  /** Revealed only at game_over so the loser sees the unsolved word. */
  opponentWordRevealed: string | null;
}

export type ErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'INVALID_NAME'
  | 'INVALID_WORD'
  | 'INVALID_LETTER'
  | 'ALREADY_GUESSED'
  | 'NOT_YOUR_TURN'
  | 'INVALID_PHASE'
  | 'RECONNECT_REJECTED'
  | 'NOT_IMPLEMENTED'
  | 'INTERNAL_ERROR';

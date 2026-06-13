import { randomInt } from 'node:crypto';
import {
  VALID_LETTER_PATTERN,
  type BoardView,
  type GameOverReason,
  type PlayerId,
} from '@dual-hangman/shared';

interface Seat {
  playerId: PlayerId;
  /** The word this player must guess — the OPPONENT's secret. */
  targetWord: string;
  guessedLetters: string[];
  /** Statistics only — wrong guesses carry no penalty (ADR-009). */
  wrongGuesses: number;
  solved: boolean;
}

/** Why a guess was refused; each value is a member of the shared ErrorCode union. */
export type GuessRejection =
  | 'NOT_YOUR_TURN'
  | 'ALREADY_GUESSED'
  | 'INVALID_LETTER'
  | 'INVALID_PHASE';

export type GuessOutcome =
  | {
      ok: true;
      /** Normalized (uppercase) letter that was applied. */
      letter: string;
      correct: boolean;
      /** True when this guess revealed the final hidden letter — the win. */
      solved: boolean;
      /** True when the turn moved to the opponent (i.e. the guess was wrong). */
      turnPassed: boolean;
    }
  | { ok: false; error: GuessRejection };

/**
 * Per-room rules engine for one round. Created when both secret words are
 * in (Phase 3); owns turn order and board state. Rules live in
 * docs/GAME_RULES.md.
 */
export class GameManager {
  private readonly seats: [Seat, Seat];
  private activeId: PlayerId;
  private winner: PlayerId | null = null;
  private overReason: GameOverReason | null = null;

  constructor(
    a: { playerId: PlayerId; secretWord: string },
    b: { playerId: PlayerId; secretWord: string },
  ) {
    this.seats = [
      {
        playerId: a.playerId,
        targetWord: b.secretWord,
        guessedLetters: [],
        wrongGuesses: 0,
        solved: false,
      },
      {
        playerId: b.playerId,
        targetWord: a.secretWord,
        guessedLetters: [],
        wrongGuesses: 0,
        solved: false,
      },
    ];
    this.activeId = randomInt(2) === 0 ? a.playerId : b.playerId;
  }

  get activePlayerId(): PlayerId {
    return this.activeId;
  }

  get winnerId(): PlayerId | null {
    return this.winner;
  }

  get gameOverReason(): GameOverReason | null {
    return this.overReason;
  }

  get isOver(): boolean {
    return this.winner !== null;
  }

  /** This player's progress against the opponent's word. */
  boardFor(guesserId: PlayerId): BoardView {
    const seat = this.seat(guesserId);
    return {
      maskedWord: seat.targetWord
        .split('')
        .map((letter) => (seat.guessedLetters.includes(letter) ? letter : null)),
      guessedLetters: [...seat.guessedLetters],
      wrongGuesses: seat.wrongGuesses,
      solved: seat.solved,
    };
  }

  /** The word this player was guessing — revealed to both sides at game over. */
  targetWordFor(playerId: PlayerId): string {
    return this.seat(playerId).targetWord;
  }

  /**
   * Applies one letter guess for the given player. Enforces all rules from
   * docs/GAME_RULES.md (turn-based, ADR-009):
   * - correct guess reveals every occurrence and the SAME player guesses again;
   * - wrong guess is recorded for stats (no penalty) and passes the turn;
   * - a repeated letter is rejected and does NOT consume the turn;
   * - the only win is fully revealing the opponent's word.
   * Returns a discriminated outcome; rejections leave all state untouched.
   */
  guessLetter(playerId: PlayerId, rawLetter: string): GuessOutcome {
    if (this.winner !== null) return { ok: false, error: 'INVALID_PHASE' };

    const letter = rawLetter.trim().toUpperCase();
    if (!VALID_LETTER_PATTERN.test(letter)) return { ok: false, error: 'INVALID_LETTER' };

    if (playerId !== this.activeId) return { ok: false, error: 'NOT_YOUR_TURN' };

    const seat = this.seat(playerId);
    if (seat.guessedLetters.includes(letter)) return { ok: false, error: 'ALREADY_GUESSED' };

    seat.guessedLetters.push(letter);

    if (seat.targetWord.includes(letter)) {
      const solved = seat.targetWord.split('').every((l) => seat.guessedLetters.includes(l));
      if (solved) {
        seat.solved = true;
        this.winner = playerId;
        this.overReason = 'word_solved';
      }
      // Correct guess: the turn stays with this player (streak continues).
      return { ok: true, letter, correct: true, solved, turnPassed: false };
    }

    // Wrong guess: stats only, then control passes to the opponent.
    seat.wrongGuesses += 1;
    this.activeId = this.opponentOf(playerId);
    return { ok: true, letter, correct: false, solved: false, turnPassed: true };
  }

  /**
   * Ends the round by forfeit — the OTHER player wins. Used when a player
   * leaves or fails to reconnect within the grace period during `playing`.
   * No-op if the game is already decided, so a late leave can't flip a result.
   */
  forfeit(playerId: PlayerId): void {
    if (this.winner !== null) return;
    this.winner = this.opponentOf(playerId);
    this.overReason = 'opponent_forfeit';
  }

  private seat(playerId: PlayerId): Seat {
    const seat = this.seats.find((s) => s.playerId === playerId);
    if (!seat) throw new Error(`GameManager: unknown player ${playerId}`);
    return seat;
  }

  private opponentOf(playerId: PlayerId): PlayerId {
    const other = this.seats.find((s) => s.playerId !== playerId);
    if (!other) throw new Error(`GameManager: no opponent for ${playerId}`);
    return other.playerId;
  }
}

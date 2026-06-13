import { randomInt } from 'node:crypto';
import type { BoardView, GameOverReason, PlayerId } from '@dual-hangman/shared';

interface Seat {
  playerId: PlayerId;
  /** The word this player must guess — the OPPONENT's secret. */
  targetWord: string;
  guessedLetters: string[];
  /** Statistics only — wrong guesses carry no penalty (ADR-009). */
  wrongGuesses: number;
  solved: boolean;
}

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

  // TODO Phase 4: guessLetter(playerId, letter) — reject out-of-turn
  //   (NOT_YOUR_TURN) and repeats (ALREADY_GUESSED). Correct guess: reveal
  //   and the same player guesses again. Wrong guess: increment stats and
  //   pass the turn. Win detection: word_solved only (ADR-009).
  // TODO Phase 4/5: forfeit(playerId) for leave/grace-expiry during play;
  //   reveal targetWord to the loser at game over (opponentWordRevealed).

  private seat(playerId: PlayerId): Seat {
    const seat = this.seats.find((s) => s.playerId === playerId);
    if (!seat) throw new Error(`GameManager: unknown player ${playerId}`);
    return seat;
  }
}

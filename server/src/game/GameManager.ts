import type { GameView, PlayerId } from '@dual-hangman/shared';

/**
 * Skeleton for the per-room game state machine. Owns turn order, guess
 * processing, and win detection once Phases 3–4 land. Rules live in
 * docs/GAME_RULES.md; the state model in docs/ARCHITECTURE.md.
 */
export class GameManager {
  // TODO Phase 3: setSecretWord(playerId, word) — validate against
  //   MIN/MAX_WORD_LENGTH + VALID_WORD_PATTERN; start the round (random
  //   first turn) once both words are in.
  //
  // TODO Phase 4: guessLetter(playerId, letter) — reject out-of-turn and
  //   repeat guesses. Correct guess: reveal letters, same player guesses
  //   again. Wrong guess: record for stats, pass the turn. Win detection:
  //   word_solved only (no loss by wrong guesses — ADR-009).
  //
  // TODO Phase 4: buildViewFor(playerId) — project authoritative state into
  //   a GameView that hides the opponent's unsolved word.

  buildViewFor(_playerId: PlayerId): GameView {
    throw new Error('GameManager.buildViewFor: implemented in Phase 4');
  }
}

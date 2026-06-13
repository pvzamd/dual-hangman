import { describe, expect, it } from 'vitest';
import { normalizeSecretWord } from '@dual-hangman/shared';
import { GameManager } from './GameManager.js';

describe('normalizeSecretWord', () => {
  it('trims and uppercases valid words', () => {
    expect(normalizeSecretWord('  puzzle ')).toBe('PUZZLE');
    expect(normalizeSecretWord('Cat')).toBe('CAT');
  });

  it('accepts boundary lengths (3 and 12)', () => {
    expect(normalizeSecretWord('abc')).toBe('ABC');
    expect(normalizeSecretWord('abcdefghijkl')).toBe('ABCDEFGHIJKL');
  });

  it('rejects words that are too short or too long', () => {
    expect(normalizeSecretWord('ab')).toBeNull();
    expect(normalizeSecretWord('abcdefghijklm')).toBeNull();
    expect(normalizeSecretWord('')).toBeNull();
    expect(normalizeSecretWord('   ')).toBeNull();
  });

  it('rejects non-letter characters', () => {
    expect(normalizeSecretWord('ab1')).toBeNull();
    expect(normalizeSecretWord('a b c')).toBeNull();
    expect(normalizeSecretWord('héllo')).toBeNull();
    expect(normalizeSecretWord('cat!')).toBeNull();
  });
});

// Both secrets contain a repeated letter (PUZZLE → Z×2, BOOK → O×2) so the
// "reveals every occurrence" check works no matter who gets the random first turn.
const ALICE = 'alice';
const BOB = 'bob';
const SECRET: Record<string, string> = { [ALICE]: 'PUZZLE', [BOB]: 'BOOK' };

const newGame = () =>
  new GameManager(
    { playerId: ALICE, secretWord: SECRET[ALICE] },
    { playerId: BOB, secretWord: SECRET[BOB] },
  );

const otherOf = (p: string) => (p === ALICE ? BOB : ALICE);
/** The word player `p` is guessing — the opponent's secret. */
const targetOf = (p: string) => SECRET[otherOf(p)];
const uniqueLetters = (word: string) => [...new Set(word.split(''))];
const letterNotIn = (word: string) => [...'QXJKVWYZ'].find((l) => !word.includes(l))!;

describe('GameManager setup', () => {
  it('assigns the first turn to one of the two players', () => {
    expect([ALICE, BOB]).toContain(newGame().activePlayerId);
  });

  it('gives each player a board over the OPPONENT word', () => {
    const game = newGame();
    expect(game.boardFor(ALICE).maskedWord).toHaveLength(SECRET[BOB].length); // BOOK → 4
    expect(game.boardFor(BOB).maskedWord).toHaveLength(SECRET[ALICE].length); // PUZZLE → 6
  });

  it('starts with fully masked boards and clean stats', () => {
    const board = newGame().boardFor(ALICE);
    expect(board.maskedWord.every((l) => l === null)).toBe(true);
    expect(board.guessedLetters).toEqual([]);
    expect(board.wrongGuesses).toBe(0);
    expect(board.solved).toBe(false);
  });

  it('has no winner at the start', () => {
    const game = newGame();
    expect(game.winnerId).toBeNull();
    expect(game.gameOverReason).toBeNull();
    expect(game.isOver).toBe(false);
  });

  it('targetWordFor returns the word the player is guessing', () => {
    const game = newGame();
    expect(game.targetWordFor(ALICE)).toBe(SECRET[BOB]);
    expect(game.targetWordFor(BOB)).toBe(SECRET[ALICE]);
  });

  it('throws for an unknown player', () => {
    expect(() => newGame().boardFor('mallory')).toThrow();
    expect(() => newGame().targetWordFor('mallory')).toThrow();
  });
});

describe('GameManager.guessLetter — correct guesses', () => {
  it('reveals the letter and keeps the turn (streak), without solving', () => {
    const game = newGame();
    const active = game.activePlayerId;
    const letter = targetOf(active)[0]; // present, but a single first letter cannot solve

    const res = game.guessLetter(active, letter);

    expect(res).toMatchObject({ ok: true, correct: true, solved: false, turnPassed: false });
    expect(game.activePlayerId).toBe(active); // streak: same player continues
    expect(game.boardFor(active).maskedWord[0]).toBe(letter);
    expect(game.boardFor(active).wrongGuesses).toBe(0);
    expect(game.isOver).toBe(false);
  });

  it('reveals EVERY occurrence of a repeated letter', () => {
    const game = newGame();
    const active = game.activePlayerId;
    const target = targetOf(active);
    const repeated = [...target].find((ch, i) => target.indexOf(ch) !== i)!;

    game.guessLetter(active, repeated);

    const board = game.boardFor(active);
    const revealed = board.maskedWord.filter((l) => l === repeated).length;
    const expected = [...target].filter((l) => l === repeated).length;
    expect(expected).toBeGreaterThanOrEqual(2);
    expect(revealed).toBe(expected);
  });

  it('accepts lowercase input and stores it uppercase', () => {
    const game = newGame();
    const active = game.activePlayerId;
    const letter = targetOf(active)[0];

    const res = game.guessLetter(active, letter.toLowerCase());

    expect(res).toMatchObject({ ok: true, correct: true });
    expect(game.boardFor(active).guessedLetters).toContain(letter);
  });

  it('lets a player guess correctly several times in a row', () => {
    const game = newGame();
    const active = game.activePlayerId;
    const letters = uniqueLetters(targetOf(active));

    for (let i = 0; i < letters.length - 1; i++) {
      const res = game.guessLetter(active, letters[i]);
      expect(res).toMatchObject({ ok: true, correct: true, turnPassed: false });
      expect(game.activePlayerId).toBe(active);
    }
    expect(game.isOver).toBe(false);
  });
});

describe('GameManager.guessLetter — wrong guesses', () => {
  it('records the miss for stats and passes the turn', () => {
    const game = newGame();
    const active = game.activePlayerId;
    const wrong = letterNotIn(targetOf(active));

    const res = game.guessLetter(active, wrong);

    expect(res).toMatchObject({ ok: true, correct: false, solved: false, turnPassed: true });
    expect(game.activePlayerId).toBe(otherOf(active));
    expect(game.boardFor(active).wrongGuesses).toBe(1);
    expect(game.boardFor(active).maskedWord.every((l) => l === null)).toBe(true);
    expect(game.isOver).toBe(false); // wrong guesses never end the game (ADR-009)
  });
});

describe('GameManager.guessLetter — winning', () => {
  it('declares word_solved when the last letter is revealed', () => {
    const game = newGame();
    const winner = game.activePlayerId;
    const target = targetOf(winner);

    let last;
    for (const letter of uniqueLetters(target)) {
      last = game.guessLetter(winner, letter);
    }

    expect(last).toMatchObject({ ok: true, correct: true, solved: true, turnPassed: false });
    expect(game.winnerId).toBe(winner);
    expect(game.gameOverReason).toBe('word_solved');
    expect(game.isOver).toBe(true);
    expect(game.boardFor(winner).solved).toBe(true);
    expect(game.boardFor(winner).maskedWord.join('')).toBe(target);
  });

  it('rejects any further guess once the game is over', () => {
    const game = newGame();
    const winner = game.activePlayerId;
    for (const letter of uniqueLetters(targetOf(winner))) {
      game.guessLetter(winner, letter);
    }
    // 'A' is in neither PUZZLE nor BOOK, so this is purely the game-over guard.
    expect(game.guessLetter(winner, 'A')).toEqual({ ok: false, error: 'INVALID_PHASE' });
  });
});

describe('GameManager.guessLetter — rejections', () => {
  it('rejects an out-of-turn guess without changing state', () => {
    const game = newGame();
    const inactive = otherOf(game.activePlayerId);

    expect(game.guessLetter(inactive, 'E')).toEqual({ ok: false, error: 'NOT_YOUR_TURN' });
    expect(game.boardFor(inactive).guessedLetters).toEqual([]);
  });

  it('rejects malformed letters', () => {
    const game = newGame();
    const active = game.activePlayerId;
    for (const bad of ['', '  ', 'AB', '1', '?', 'ab c']) {
      expect(game.guessLetter(active, bad)).toEqual({ ok: false, error: 'INVALID_LETTER' });
    }
    expect(game.boardFor(active).guessedLetters).toEqual([]);
  });

  it('rejects a repeated letter and does NOT consume the turn', () => {
    const game = newGame();
    const active = game.activePlayerId;
    const letter = targetOf(active)[0];

    game.guessLetter(active, letter); // first time: correct
    const res = game.guessLetter(active, letter); // again

    expect(res).toEqual({ ok: false, error: 'ALREADY_GUESSED' });
    expect(game.activePlayerId).toBe(active); // still this player's turn
    expect(game.boardFor(active).guessedLetters.filter((l) => l === letter)).toHaveLength(1);
  });

  it('tracks guessed letters per player — the opponent may reuse a letter', () => {
    const game = newGame();
    const first = game.activePlayerId;
    const wrong = letterNotIn(targetOf(first));

    game.guessLetter(first, wrong); // wrong → turn passes to the opponent
    const second = game.activePlayerId;
    expect(second).toBe(otherOf(first));

    // The opponent guessing the SAME letter against THEIR board is not a repeat.
    const res = game.guessLetter(second, wrong);
    expect(res.ok).toBe(true);
    expect(game.boardFor(second).guessedLetters).toContain(wrong);
  });

  it('lets a player re-guess only after the turn cycles back (repeat detection is per board)', () => {
    const game = newGame();
    const first = game.activePlayerId;
    const wrongA = letterNotIn(targetOf(first));

    game.guessLetter(first, wrongA); // turn → second
    const second = game.activePlayerId;
    const wrongB = [...'QXJKVWYZ'].find((l) => l !== wrongA && !targetOf(second).includes(l))!;
    game.guessLetter(second, wrongB); // turn → back to first

    expect(game.activePlayerId).toBe(first);
    // first already used wrongA against their own board
    expect(game.guessLetter(first, wrongA)).toEqual({ ok: false, error: 'ALREADY_GUESSED' });
  });
});

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

describe('GameManager', () => {
  const newGame = () =>
    new GameManager(
      { playerId: 'alice', secretWord: 'PUZZLE' },
      { playerId: 'bob', secretWord: 'CAT' },
    );

  it('assigns the first turn to one of the two players', () => {
    const game = newGame();
    expect(['alice', 'bob']).toContain(game.activePlayerId);
  });

  it('gives each player a board over the OPPONENT word', () => {
    const game = newGame();
    // Alice guesses Bob's word (CAT, 3 letters); Bob guesses PUZZLE (6).
    expect(game.boardFor('alice').maskedWord).toHaveLength(3);
    expect(game.boardFor('bob').maskedWord).toHaveLength(6);
  });

  it('starts with fully masked boards and clean stats', () => {
    const board = newGame().boardFor('alice');
    expect(board.maskedWord.every((letter) => letter === null)).toBe(true);
    expect(board.guessedLetters).toEqual([]);
    expect(board.wrongGuesses).toBe(0);
    expect(board.solved).toBe(false);
  });

  it('has no winner at the start', () => {
    const game = newGame();
    expect(game.winnerId).toBeNull();
    expect(game.gameOverReason).toBeNull();
  });

  it('throws for an unknown player', () => {
    expect(() => newGame().boardFor('mallory')).toThrow();
  });
});

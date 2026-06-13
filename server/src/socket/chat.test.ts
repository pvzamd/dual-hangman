import { describe, expect, it } from 'vitest';
import { MAX_CHAT_LENGTH, normalizeChatText } from '@dual-hangman/shared';

describe('normalizeChatText', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeChatText('  hi there  ')).toBe('hi there');
  });

  it('rejects empty or whitespace-only messages', () => {
    expect(normalizeChatText('')).toBeNull();
    expect(normalizeChatText('   ')).toBeNull();
    expect(normalizeChatText('\n\t')).toBeNull();
  });

  it('caps length at MAX_CHAT_LENGTH', () => {
    const long = 'a'.repeat(MAX_CHAT_LENGTH + 50);
    expect(normalizeChatText(long)).toHaveLength(MAX_CHAT_LENGTH);
  });

  it('keeps a normal message intact', () => {
    expect(normalizeChatText('gg wp')).toBe('gg wp');
  });
});

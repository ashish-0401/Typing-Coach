import { describe, it, expect } from 'vitest';
import {
  calculateWpm,
  calculateAccuracy,
  diffInput,
  countCorrectChars,
  countCharStats,
  findMistypedWords,
} from './metrics';

describe('calculateWpm', () => {
  it('uses (characters / 5) / minutes', () => {
    // 25 chars = 5 words, in 60s => 5 wpm
    expect(calculateWpm(25, 60_000)).toBe(5);
  });

  it('scales with time: 50 chars in 30s => 20 wpm', () => {
    expect(calculateWpm(50, 30_000)).toBe(20);
  });

  it('returns 0 for non-positive characters or time', () => {
    expect(calculateWpm(0, 60_000)).toBe(0);
    expect(calculateWpm(25, 0)).toBe(0);
    expect(calculateWpm(-5, 60_000)).toBe(0);
  });
});

describe('calculateAccuracy', () => {
  it('computes correct / total as a percentage', () => {
    expect(calculateAccuracy(90, 100)).toBe(90);
    expect(calculateAccuracy(1, 2)).toBe(50);
  });

  it('returns 100 when nothing has been typed', () => {
    expect(calculateAccuracy(0, 0)).toBe(100);
  });
});

describe('diffInput', () => {
  const target = 'hello world';

  it('counts a correct character addition', () => {
    expect(diffInput(target, 'hel', 'hell')).toEqual({
      added: 1,
      addedCorrect: 1,
      backspaces: 0,
    });
  });

  it('counts an incorrect character addition', () => {
    expect(diffInput(target, 'hel', 'helx')).toEqual({
      added: 1,
      addedCorrect: 0,
      backspaces: 0,
    });
  });

  it('counts deletions as backspaces', () => {
    expect(diffInput(target, 'hell', 'hel')).toEqual({
      added: 0,
      addedCorrect: 0,
      backspaces: 1,
    });
  });

  it('handles multi-character additions (e.g. paste)', () => {
    expect(diffInput(target, 'hello', 'hello wo')).toEqual({
      added: 3,
      addedCorrect: 3,
      backspaces: 0,
    });
  });

  it('reports no change when value is identical', () => {
    expect(diffInput(target, 'hello', 'hello')).toEqual({
      added: 0,
      addedCorrect: 0,
      backspaces: 0,
    });
  });
});

describe('countCorrectChars', () => {
  it('counts matching leading characters', () => {
    expect(countCorrectChars('hello', 'hello')).toBe(5);
    expect(countCorrectChars('hello', 'help')).toBe(3);
    expect(countCorrectChars('hello', 'xello')).toBe(4);
  });

  it('never counts beyond the shorter string', () => {
    expect(countCorrectChars('hi', 'history')).toBe(2);
  });
});

describe('countCharStats', () => {
  it('splits correct and incorrect characters', () => {
    expect(countCharStats('hello', 'hexlo')).toEqual({ correct: 4, incorrect: 1 });
  });

  it('only counts the typed portion', () => {
    expect(countCharStats('hello world', 'hello')).toEqual({ correct: 5, incorrect: 0 });
  });
});

describe('findMistypedWords', () => {
  const target = 'the quick brown fox';

  it('returns words with at least one wrong character that the user has reached', () => {
    // "quick" typed as "qwick"
    expect(findMistypedWords(target, 'the qwick')).toEqual(['quick']);
  });

  it('returns an empty array when everything typed so far is correct', () => {
    expect(findMistypedWords(target, 'the quick br')).toEqual([]);
  });

  it('does not include words the user has not reached yet', () => {
    expect(findMistypedWords(target, 'the qui')).toEqual([]);
  });

  it('collects multiple distinct mistyped words without duplicates', () => {
    expect(findMistypedWords('aa bb aa', 'xa bx xa')).toEqual(['aa', 'bb']);
  });
});

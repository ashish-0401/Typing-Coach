/**
 * Pure typing-metrics logic. No React, no DOM, safe to unit test in isolation.
 *
 * Conventions (from the project design):
 *   WPM      = (characters / 5) / minutes
 *   Accuracy = correct characters / total typed characters, as a percentage
 *
 * "characters" for WPM means correctly-typed characters (net WPM), so the metric
 * cannot be inflated by mashing wrong keys.
 */

const CHARS_PER_WORD = 5;
const MS_PER_MINUTE = 60_000;

/** Words-per-minute from a character count and an elapsed duration in milliseconds. */
export function calculateWpm(characters: number, elapsedMs: number): number {
  if (characters <= 0 || elapsedMs <= 0) {
    return 0;
  }
  const minutes = elapsedMs / MS_PER_MINUTE;
  return characters / CHARS_PER_WORD / minutes;
}

/** Accuracy percentage from correct vs. total typed characters. */
export function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) {
    return 100;
  }
  return (correct / total) * 100;
}

export interface InputDelta {
  /** Number of characters added in this change. */
  added: number;
  /** How many of the added characters matched the target. */
  addedCorrect: number;
  /** Number of characters removed (backspaces) in this change. */
  backspaces: number;
}

/**
 * Compares the previous and next input values against the target to classify a
 * single edit as additions (with correctness) or deletions. Used to accumulate
 * keystroke counters as the user types.
 */
export function diffInput(target: string, previous: string, next: string): InputDelta {
  if (next.length > previous.length) {
    let addedCorrect = 0;
    for (let i = previous.length; i < next.length; i += 1) {
      if (next[i] === target[i]) {
        addedCorrect += 1;
      }
    }
    return { added: next.length - previous.length, addedCorrect, backspaces: 0 };
  }

  if (next.length < previous.length) {
    return { added: 0, addedCorrect: 0, backspaces: previous.length - next.length };
  }

  return { added: 0, addedCorrect: 0, backspaces: 0 };
}

/** Count of positions where the typed text matches the target. */
export function countCorrectChars(target: string, typed: string): number {
  const length = Math.min(target.length, typed.length);
  let correct = 0;
  for (let i = 0; i < length; i += 1) {
    if (typed[i] === target[i]) {
      correct += 1;
    }
  }
  return correct;
}

export interface CharStats {
  correct: number;
  incorrect: number;
}

/** Correct vs. incorrect character counts over the portion the user has typed. */
export function countCharStats(target: string, typed: string): CharStats {
  const length = Math.min(target.length, typed.length);
  let correct = 0;
  let incorrect = 0;
  for (let i = 0; i < length; i += 1) {
    if (typed[i] === target[i]) {
      correct += 1;
    } else {
      incorrect += 1;
    }
  }
  return { correct, incorrect };
}

/**
 * Returns the distinct target words the user mistyped: any word the typist has
 * reached where at least one character in that word's span doesn't match.
 */
export function findMistypedWords(target: string, typed: string): string[] {
  const mistyped: string[] = [];
  const seen = new Set<string>();
  const wordPattern = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = wordPattern.exec(target)) !== null) {
    const word = match[0];
    const start = match.index;
    if (typed.length <= start) {
      break; // user hasn't reached this word yet
    }

    const compareEnd = Math.min(start + word.length, typed.length);
    let wrong = false;
    for (let i = start; i < compareEnd; i += 1) {
      if (typed[i] !== target[i]) {
        wrong = true;
        break;
      }
    }

    if (wrong && !seen.has(word)) {
      seen.add(word);
      mistyped.push(word);
    }
  }

  return mistyped;
}

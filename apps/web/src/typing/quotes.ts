// "Quote" mode types real, properly-formatted quotes for typing practice,
// bundled the way MonkeyType and Keymash ship their quotes (NOT a flaky public
// API). The curated set in quotes-en.ts is clean, offline and instant.
import { QUOTES_EN } from './quotes-en';

/** A random bundled quote (instant, offline). */
export function randomQuote(): string {
  return (
    QUOTES_EN[Math.floor(Math.random() * QUOTES_EN.length)] ??
    'The quick brown fox jumps over the lazy dog.'
  );
}

/**
 * Returns a bundled quote. Kept Promise-returning so the typing page's existing
 * flow is unchanged; it resolves instantly (no network).
 */
export function fetchQuote(): Promise<string> {
  return Promise.resolve(randomQuote());
}

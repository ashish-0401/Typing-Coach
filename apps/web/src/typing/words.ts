import { WORDS_EN } from './words-en';

// Difficulty tiers: how deep into the frequency-ordered list to sample from.
// Higher diff = rarer (but still real) words = harder finger patterns.
const TIER_SIZES = [300, 600, 1000, 1500, WORDS_EN.length];

function tierSize(diff: number): number {
  const clamped = Math.min(Math.max(Math.round(diff), 1), TIER_SIZES.length);
  return TIER_SIZES[clamped - 1] ?? WORDS_EN.length;
}

const PUNCTUATION = [',', '.', ';', ':', '!', '?'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPunctuation(): string {
  return PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)] ?? '.';
}

function randomNumberToken(): string {
  // Small variety to train number row without producing unreadable junk.
  return String(randomInt(0, 9999));
}

export interface GenerateWordOptions {
  punctuation?: boolean;
  numbers?: boolean;
}

/**
 * A stream of `count` common words. `diff` (1-5) picks how deep into the
 * frequency-ordered list to sample from: higher = rarer, harder-to-type words.
 */
export function generateWords(
  count: number,
  diff: number,
  options: GenerateWordOptions = {},
): string {
  const { punctuation = false, numbers = false } = options;
  const size = tierSize(diff);
  const words: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let token = WORDS_EN[Math.floor(Math.random() * size)] ?? 'the';

    // Roughly 1 in 6 tokens becomes a number when enabled.
    if (numbers && Math.random() < 0.17) {
      token = randomNumberToken();
    }

    // Add punctuation to some tokens to simulate natural punctuation typing.
    if (punctuation && Math.random() < 0.22) {
      token = `${token}${randomPunctuation()}`;
    }

    words.push(token);
  }
  return words.join(' ');
}

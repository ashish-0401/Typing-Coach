import { WORDS_EN } from './words-en';

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

/** A stream of `count` random common words. */
export function generateWords(
  count: number,
  options: GenerateWordOptions = {},
): string {
  const { punctuation = false, numbers = false } = options;
  const words: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let token = WORDS_EN[Math.floor(Math.random() * WORDS_EN.length)] ?? 'the';

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

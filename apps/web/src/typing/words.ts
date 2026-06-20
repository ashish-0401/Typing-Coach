// Common English words for the random word stream (kept lowercase, no punctuation).
const WORDS: string[] = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
  'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
  'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so',
  'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
  'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people',
  'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
  'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'great',
  'world', 'still', 'every', 'between', 'never', 'under', 'while', 'might', 'place', 'again',
  'around', 'small', 'found', 'thought', 'house', 'point', 'though', 'water', 'side', 'enough',
  'almost', 'between', 'often', 'really', 'always', 'something', 'nothing', 'better', 'until', 'across',
  'behind', 'cannot', 'become', 'before', 'people', 'system', 'program', 'question', 'during', 'without',
  'before', 'large', 'must', 'big', 'high', 'different', 'following', 'began', 'change', 'kind',
  'spell', 'air', 'away', 'animal', 'letter', 'mother', 'answer', 'found', 'study', 'learn',
  'should', 'America', 'world', 'near', 'build', 'self', 'earth', 'father', 'head', 'stand',
  'own', 'page', 'should', 'country', 'school', 'grow', 'study', 'still', 'learn', 'plant',
];

function shuffleSeed(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)] ?? 'the';
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

/** Returns a string of `count` space-separated random words. */
export function generateWords(count: number, options: GenerateWordOptions = {}): string {
  const { punctuation = false, numbers = false } = options;
  const words: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let token = shuffleSeed();

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

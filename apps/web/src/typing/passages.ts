const PASSAGES: string[] = [
  'The quick brown fox jumps over the lazy dog while the committee receives a separate letter.',
  'Practice does not make perfect, but practice with feedback makes steady and lasting progress.',
  'A calm mind types with rhythm, letting accuracy lead and speed follow close behind it.',
  'Good developers read more code than they write, and they write code that is easy to read.',
  'Deliberate practice means working at the edge of your ability and reviewing every mistake.',
];

/** Returns a random practice passage. */
export function pickPassage(): string {
  const index = Math.floor(Math.random() * PASSAGES.length);
  return PASSAGES[index] ?? PASSAGES[0];
}

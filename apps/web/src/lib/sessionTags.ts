/**
 * Session tag vocabulary. Tags are stored compact on the session (e.g. "30s",
 * "25w", "drill") and expanded to readable labels in the UI. They let history be
 * filtered so like-for-like sessions are compared (WPM varies a lot with length).
 */

type Mode = 'time' | 'words';

/** The tag recording a Practice session's configuration, e.g. "30s" or "25w". */
export function configTag(
  mode: Mode,
  timeSec: number,
  wordCount: number,
): string {
  return mode === 'time' ? `${timeSec}s` : `${wordCount}w`;
}

/** Human label for a tag: "30s" -> "30 seconds", "25w" -> "25 words", else as-is. */
export function tagLabel(tag: string): string {
  const seconds = /^(\d+)s$/.exec(tag);
  if (seconds) {
    return `${seconds[1]} ${seconds[1] === '1' ? 'second' : 'seconds'}`;
  }
  const words = /^(\d+)w$/.exec(tag);
  if (words) {
    return `${words[1]} ${words[1] === '1' ? 'word' : 'words'}`;
  }
  return tag;
}

/** Order tags: time configs, then word configs (each by count), then others. */
export function compareTags(a: string, b: string): number {
  const rank = (tag: string): [number, number] => {
    const seconds = /^(\d+)s$/.exec(tag);
    if (seconds) {
      return [0, Number(seconds[1])];
    }
    const words = /^(\d+)w$/.exec(tag);
    if (words) {
      return [1, Number(words[1])];
    }
    return [2, 0];
  };
  const [rankA, numA] = rank(a);
  const [rankB, numB] = rank(b);
  return rankA - rankB || numA - numB || a.localeCompare(b);
}

// "Prose" mode source: real sentences/paragraphs instead of a random word stream.
// Pulls from a free public quotes API (no key, CORS-enabled) and ALWAYS falls back
// to a bundled set of original sentences, so the test never blocks on the network.

// DummyJSON: reliable, CORS-enabled, no key. Returns an array of 3 random quotes.
const QUOTES_API = 'https://dummyjson.com/quotes/random/3';
const FETCH_TIMEOUT_MS = 2500;
const MAX_LEN = 600;
const MIN_LEN = 40;

// Original, neutral sentences (no copyrighted quotes). Used as the offline
// fallback and whenever the API is slow or unavailable.
const LOCAL_PASSAGES: string[] = [
  'The morning light spread slowly across the quiet street as the city began to stir, and the first buses rolled past with their windows still fogged.',
  'Good practice is less about raw speed and more about steady, deliberate repetition, the kind that turns a clumsy motion into something you no longer have to think about.',
  'A river finds its way around every stone, patient and unhurried, and though it bends a thousand times it always reaches the sea.',
  'She kept a small notebook in her coat pocket and wrote down anything that surprised her, certain that a single odd detail could one day become a whole story.',
  'The workshop smelled of cut pine and warm oil, and every tool hung in its own outlined place on the wall above the long wooden bench.',
  'Learning a new skill feels awkward at first because your hands are still negotiating with your intentions, but the gap closes a little more each day.',
  'Rain tapped against the window in an uneven rhythm while the kettle clicked off and the room filled with the quiet comfort of an ordinary evening.',
  'The map was old and the roads had changed, yet the mountains in the distance stood exactly where they had always been, calm and indifferent to our plans.',
  'He measured twice, cut once, and still the board came out a hair too short, which is how he learned that patience and precision are not the same thing.',
  'When the power went out the whole neighborhood seemed to exhale, and for an hour people sat on their porches and actually spoke to one another.',
  'A good sentence carries its meaning lightly, without straining, the way a bridge carries a heavy load by spreading the weight across every careful joint.',
  'The garden took three seasons to find its shape, and only then did she understand that planting is mostly an act of trust in a future you cannot see.',
  'Type the words as they come, let your eyes lead and your fingers follow, and resist the urge to glance down whenever a small mistake slips through.',
  'The train pulled out exactly on time, and the platform, so crowded a moment ago, was suddenly empty except for a single gull picking at a paper bag.',
  'Curiosity is a quiet engine; it rarely shouts, but it keeps you reading one more page, asking one more question, trying one more time when others have stopped.',
  'The bread needed nothing more than flour, water, salt, and time, and yet the waiting was the hardest ingredient to measure out correctly.',
  'Far from the city the night sky opened up like a second ocean, and the stars were so thick and bright that the old constellations were hard to find.',
  'Every craft has its plateaus, those long flat stretches where nothing seems to improve, and the trick is to keep showing up until the ground tilts upward again.',
  'The librarian moved through the stacks without a sound, reshelving books by memory, her hands knowing the order of the world better than any catalog could.',
  'A small habit repeated daily will quietly outwork a grand plan attempted once, because consistency compounds while enthusiasm tends to fade.',
  'The coffee had gone cold long ago, but she barely noticed, lost in the steady satisfaction of solving one stubborn problem one careful line at a time.',
  'Snow fell without any wind to push it, drifting straight down in fat, slow flakes that softened every edge of the city into something gentler.',
  'He read the instructions twice, ignored them both times, and learned everything the hard way, which is somehow still the way most lessons seem to stick.',
  'The best tools disappear in your hands; you stop noticing the keyboard, the brush, the wrench, and you are left alone with the work and the quiet pleasure of doing it well.',
];

function capAtWord(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}

/** Normalize quote text to clean, typeable ASCII: straight quotes, no smart
 *  punctuation or stray characters, single spaces, capped at a word boundary. */
function normalizePassage(text: string): string {
  const ascii = text
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return capAtWord(ascii, MAX_LEN);
}

interface RandomQuote {
  quote?: string;
}

/** A random bundled passage (instant, offline). */
export function localProsePassage(): string {
  const index = Math.floor(Math.random() * LOCAL_PASSAGES.length);
  return (
    LOCAL_PASSAGES[index] ??
    LOCAL_PASSAGES[0] ??
    'The quick brown fox jumps over the lazy dog.'
  );
}

/** Log why we fell back to a bundled passage, then return one. */
function fallbackPassage(reason: string): string {
  console.warn(`[prose] ${reason}; using a bundled passage instead.`);
  return localProsePassage();
}

/**
 * Fetch a short paragraph of real sentences from the public quotes API, falling
 * back to a bundled passage on any error, timeout, or empty/short response.
 */
export async function fetchProsePassage(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(QUOTES_API, { signal: controller.signal });
    if (!response.ok) {
      return fallbackPassage(
        `quotes API responded with status ${response.status}`,
      );
    }
    const data = (await response.json()) as RandomQuote[];
    const joined = Array.isArray(data)
      ? data
          .map((item) => item.quote ?? '')
          .filter(Boolean)
          .join(' ')
      : '';
    const cleaned = normalizePassage(joined);
    if (cleaned.length >= MIN_LEN) {
      return cleaned;
    }
    return fallbackPassage('quotes API returned no usable text');
  } catch (error) {
    const reason =
      error instanceof DOMException && error.name === 'AbortError'
        ? `quotes API timed out after ${FETCH_TIMEOUT_MS}ms`
        : `quotes API request failed (${
            error instanceof Error ? error.message : String(error)
          })`;
    return fallbackPassage(reason);
  } finally {
    clearTimeout(timeout);
  }
}

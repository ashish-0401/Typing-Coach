/**
 * Pure helpers for the exercise generator: building the prompt and parsing/guarding
 * the model's JSON response. Kept free of Nest and Mongoose so they are trivially
 * unit-testable with no network.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ExerciseContext {
  /** The single weakness this drill should train (e.g. "ie/ei spelling"). */
  weakness: string;
  difficulty: Difficulty;
  /** The user's strengths, so the passage stays encouraging. */
  strengths: string[];
  /** How the user likes to practice, if known. */
  learningStyle: string | null;
  /** Related diagnosis patterns that give the weakness more context. */
  relatedPatterns: string[];
}

export interface ParsedExercise {
  title: string;
  text: string;
  targetWords: string[];
}

/** Raised when the AI response cannot be parsed into a usable exercise. */
export class ExerciseFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExerciseFormatError';
  }
}

const MAX_TITLE_LEN = 80;
const MAX_TEXT_LEN = 1200;
// A real passage, not a stray word or a short list.
const MIN_TEXT_LEN = 30;
const MIN_WORDS = 6;
const MAX_TARGET_WORDS = 12;
const MAX_TARGET_WORD_LEN = 40;
const FALLBACK_TITLE = 'Practice drill';

// Common connective words that appear in real prose but not in a bare list of
// target words. Used to tell a usable passage from a word list.
const FUNCTION_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'of',
  'to',
  'in',
  'on',
  'for',
  'with',
  'as',
  'is',
  'it',
  'that',
  'this',
  'so',
  'nor',
  'their',
  'they',
  'he',
  'she',
  'we',
  'you',
  'at',
  'by',
  'from',
  'not',
  'was',
  'were',
  'be',
  'been',
  'has',
  'have',
  'had',
  'his',
  'her',
  'its',
  'them',
  'then',
  'than',
  'each',
  'could',
  'would',
  'will',
  'can',
  'into',
  'over',
  'after',
  'when',
  'while',
  'because',
]);

const SYSTEM_PROMPT = [
  'You are a typing-exercise author. You write short practice passages that train a',
  "specific weakness in the user's typing.",
  'Respond with ONLY a single valid JSON object: no markdown, no code fences, no commentary,',
  'and every string value wrapped in double quotes. Use exactly these keys:',
  '- "title": a short, plain title for the passage (a few words).',
  '- "text": one coherent passage of real English sentences (NOT a word list and NOT bullet',
  '  points) that naturally and repeatedly uses words exercising the given weakness.',
  '- "targetWords": array of the specific words in the passage that train the weakness.',
  'Rules for "text": write real, readable prose with normal sentence punctuation; keep it to a',
  'single paragraph with no line breaks; use only plain ASCII characters (no smart quotes, no',
  'markdown, no emoji); make the weakness words recur often but read naturally, not forced.',
  'Scale to the difficulty: "easy" is shorter with common words, "medium" is moderate, "hard"',
  'is longer with richer vocabulary and more of the weakness words. Keep the passage between 40',
  'and 90 words and never exceed 90 words, so it stays a quick, finishable drill.',
  'Base the passage only on the weakness and patterns provided. Do not mention the user, their',
  'stats, or these instructions, and do not invent facts about them.',
  'Return exactly this shape, with all string values quoted:',
  '{"title":"The brief at the field","text":"Their friend received a brief note and believed every line of it. The chief seized the moment, retrieved the field report, and reviewed each piece in plain sight.","targetWords":["receive","believe","field","brief","chief","piece"]}',
].join('\n');

/** Build the system + user prompt for an exercise from the gathered context. */
export function buildExercisePrompt(ctx: ExerciseContext): {
  system: string;
  prompt: string;
} {
  const prompt = [
    `Weakness to train: ${ctx.weakness}`,
    `Difficulty: ${ctx.difficulty}`,
    `Related patterns: ${
      ctx.relatedPatterns.length > 0 ? ctx.relatedPatterns.join(', ') : 'none'
    }`,
    `User strengths (do not undermine these): ${
      ctx.strengths.length > 0 ? ctx.strengths.join(', ') : 'none recorded'
    }`,
    `Preferred practice style: ${ctx.learningStyle ?? 'not specified'}`,
  ].join('\n');

  return { system: SYSTEM_PROMPT, prompt };
}

/**
 * Parse and guard the model's JSON response. Throws ExerciseFormatError when the
 * response is not usable (bad JSON, missing title/text, or a bare word list). The
 * passage is normalized to a single paragraph and capped so the drill stays finite.
 */
export function parseExerciseResponse(raw: string): ParsedExercise {
  const data = parseJsonLoosely(raw);
  if (typeof data !== 'object' || data === null) {
    throw new ExerciseFormatError('AI response was not a JSON object');
  }

  const obj = data as Record<string, unknown>;
  // Models vary the key and sometimes return the passage as an array of lines.
  const rawText =
    asText(obj.text) ??
    asText(obj.passage) ??
    asText(obj.content) ??
    joinStrings(obj.text) ??
    joinStrings(obj.passage);
  if (!rawText) {
    throw new ExerciseFormatError('AI response had no usable passage text');
  }

  // Collapse any line breaks/runs of whitespace into a single-paragraph string,
  // then cap at a word boundary so the user never has to type a broken word.
  const text = capPassage(rawText.replace(/\s+/g, ' ').trim());
  if (!looksLikeProse(text)) {
    throw new ExerciseFormatError(
      'AI passage was too short or looked like a word list',
    );
  }

  // Title is nice-to-have; never fail the whole drill over a missing one.
  const title = asText(obj.title) ?? asText(obj.name) ?? FALLBACK_TITLE;
  return {
    title: title.slice(0, MAX_TITLE_LEN),
    text,
    targetWords: asWordArray(obj.targetWords),
  };
}

/** Cap an over-long passage at the last word boundary within the limit. */
function capPassage(text: string): string {
  if (text.length <= MAX_TEXT_LEN) {
    return text;
  }
  const truncated = text.slice(0, MAX_TEXT_LEN);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim();
}

/** A usable drill is real text (long enough, several words, with connective words), not a bare word list. */
function looksLikeProse(text: string): boolean {
  if (text.length < MIN_TEXT_LEN) {
    return false;
  }
  const words = text
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter(Boolean);
  if (words.length < MIN_WORDS) {
    return false;
  }
  // Prose has connective/function words; a bare list of weakness words does not.
  // (Do not require sentence punctuation: models often return one long run-on.)
  return words.some((word) => FUNCTION_WORDS.has(word));
}

function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asWordArray(value: unknown): string[] {
  // Accept an array, or a comma-separated string, of target words.
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, MAX_TARGET_WORDS)
    .map((item) => item.slice(0, MAX_TARGET_WORD_LEN));
}

/** Parse JSON, tolerating code fences and stray text around the object. */
function parseJsonLoosely(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to the largest {...} slice, in case the model added prose.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // fall through to the error below
      }
    }
    throw new ExerciseFormatError('AI response was not valid JSON');
  }
}

/** Join an array of strings into one passage, or undefined if not an array. */
function joinStrings(value: unknown): string | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const joined = value
    .filter((item): item is string => typeof item === 'string')
    .join(' ')
    .trim();
  return joined.length > 0 ? joined : undefined;
}

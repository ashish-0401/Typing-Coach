/**
 * Pure helpers for the AI diagnosis: building the prompt and parsing/guarding the
 * model's JSON response. Kept free of Nest and Mongoose so they are trivially
 * unit-testable with no network.
 */

export interface DiagnosisContext {
  currentWpm: number;
  bestWpm: number;
  averageWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  plateauDetected: boolean;
  topMistakes: string[];
  /** Recent WPM, oldest to newest. */
  recentWpm: number[];
  /** Recent accuracy, oldest to newest. */
  recentAccuracy: number[];
}

export interface ParsedDiagnosis {
  summary: string;
  reasoning: string;
  patterns: string[];
  strengths: string[];
  learningStyle: string;
}

/** Raised when the AI response cannot be parsed into a usable diagnosis. */
export class DiagnosisFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiagnosisFormatError';
  }
}

const MAX_TEXT = 600;
const MAX_TAGS = 6;
const MAX_TAG_LEN = 60;
const MAX_STYLE = 160;

const SYSTEM_PROMPT = [
  "You are an expert typing coach analyzing a user's recent performance.",
  'Respond with ONLY a single valid JSON object: no markdown, no commentary, and every',
  'string value wrapped in double quotes. Use exactly these keys:',
  '- "summary": one short sentence naming the main thing holding the user back.',
  '- "reasoning": 2 to 3 sentences explaining WHY, citing the data provided.',
  '- "patterns": array of 2 to 5 short lowercase tags (e.g. "ie/ei spelling", "double letters").',
  '- "strengths": array of 1 to 3 short strengths.',
  '- "learningStyle": one short phrase on how they should practice next.',
  'Base every claim only on the data provided. Do not invent numbers or words.',
  'Return exactly this shape, with all string values quoted:',
  '{"summary":"You lose time on long words.","reasoning":"Accuracy dips on words over 8 letters such as receive and believe, while short words stay clean.","patterns":["long words","ie/ei spelling"],"strengths":["steady rhythm"],"learningStyle":"short drills on your weak words"}',
].join('\n');

/** Build the system + user prompt for a diagnosis from the gathered context. */
export function buildDiagnosisPrompt(ctx: DiagnosisContext): {
  system: string;
  prompt: string;
} {
  const prompt = [
    `Sessions analyzed: ${ctx.totalSessions}`,
    `WPM: current ${ctx.currentWpm}, average ${ctx.averageWpm}, best ${ctx.bestWpm}`,
    `Average accuracy: ${ctx.averageAccuracy}%`,
    `Plateaued: ${ctx.plateauDetected ? 'yes' : 'no'}`,
    `Most mistyped words: ${
      ctx.topMistakes.length > 0 ? ctx.topMistakes.join(', ') : 'none recorded'
    }`,
    `Recent WPM (old to new): ${ctx.recentWpm.join(', ') || 'n/a'}`,
    `Recent accuracy (old to new): ${ctx.recentAccuracy.join(', ') || 'n/a'}`,
  ].join('\n');

  return { system: SYSTEM_PROMPT, prompt };
}

/**
 * Parse and guard the model's JSON response. Throws DiagnosisFormatError when the
 * response is not usable (bad JSON, or missing summary/reasoning). Optional fields
 * are normalized: arrays keep only trimmed strings, capped in count and length.
 */
export function parseDiagnosisResponse(raw: string): ParsedDiagnosis {
  let data: unknown;
  try {
    data = JSON.parse(raw.trim());
  } catch {
    throw new DiagnosisFormatError('AI response was not valid JSON');
  }

  if (typeof data !== 'object' || data === null) {
    throw new DiagnosisFormatError('AI response was not a JSON object');
  }

  const obj = data as Record<string, unknown>;
  const summary = asText(obj.summary);
  const reasoning = asText(obj.reasoning);
  if (!summary || !reasoning) {
    throw new DiagnosisFormatError('AI response missing summary or reasoning');
  }

  return {
    summary: summary.slice(0, MAX_TEXT),
    reasoning: reasoning.slice(0, MAX_TEXT),
    patterns: asTagArray(obj.patterns),
    strengths: asTagArray(obj.strengths),
    learningStyle: (asText(obj.learningStyle) ?? '').slice(0, MAX_STYLE),
  };
}

function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asTagArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, MAX_TAGS)
    .map((item) => item.slice(0, MAX_TAG_LEN));
}

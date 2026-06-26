/**
 * Pure helpers for the Phase 6 coaching cycle's Planning and Evaluation steps:
 * building the planning prompt, parsing/guarding the model's JSON plan, and a
 * math-only evaluation of the previous plan. Kept free of Nest and Mongoose so
 * they are trivially unit-testable with no network, mirroring diagnosis.ts and
 * exercise-generator.ts.
 */

import type { Difficulty } from '../exercises/exercise-generator';

export type { Difficulty };

/** The two measurable things a training goal can target. */
export type GoalMetric = 'wpm' | 'accuracy';

/** The benchmark numbers from AnalyticsService (drills excluded). */
export interface BenchmarkStats {
  currentWpm: number;
  bestWpm: number;
  averageWpm: number;
  averageAccuracy: number;
}

/** One measurable goal for the next cycle. */
export interface PlanGoal {
  metric: GoalMetric;
  target: number;
  rationale: string;
}

/** A drill the coach recommends for one of the plan's target weaknesses. */
export interface RecommendedDrill {
  weakness: string;
  difficulty: Difficulty;
}

/** Result of comparing the user's current stats to the previous plan (no AI). */
export interface PlanEvaluation {
  wpmDelta: number;
  accuracyDelta: number;
  metGoals: string[];
}

/** The previous plan's summary and goals, passed in for narrative continuity. */
export interface PreviousPlanSummary {
  summary: string;
  goals: PlanGoal[];
}

/**
 * Everything the Planning step needs, carrying ONLY real data: the benchmark
 * stats, the weaknesses to choose from, the user's strengths and style, and the
 * previous plan (if any) for continuity.
 */
export interface PlanContext {
  stats: BenchmarkStats;
  diagnosisPatterns: string[];
  primaryWeaknesses: string[];
  strengths: string[];
  learningStyle: string | null;
  previousPlan: PreviousPlanSummary | null;
}

/** The guarded, normalized plan produced from the model's response. */
export interface ParsedPlan {
  summary: string;
  targetWeaknesses: string[];
  goals: PlanGoal[];
  recommendedDrills: RecommendedDrill[];
}

/** Benchmark numbers captured when a plan was made, to score the next cycle. */
export interface PlanBaseline {
  wpm: number;
  accuracy: number;
}

/** The previous plan's baseline and goals, the only fields evaluation needs. */
export interface PreviousPlanForEval {
  baseline: PlanBaseline;
  goals: PlanGoal[];
}

/** Raised when the AI response cannot be parsed into a usable plan. */
export class PlanFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanFormatError';
  }
}

const MAX_SUMMARY = 800;
const MAX_RATIONALE = 240;
const MAX_WEAKNESS_LEN = 60;
const MAX_GOALS = 4;
const MAX_TARGET_WEAKNESSES = 6;
const MAX_DRILLS = 3;

// Sane ranges for a typing goal. Anything outside is treated as invented and dropped.
const WPM_MIN = 1;
const WPM_MAX = 400;
const ACCURACY_MIN = 1;
const ACCURACY_MAX = 100;

const SYSTEM_PROMPT = [
  'You are an expert typing coach writing the next short training plan for one user.',
  'Respond with ONLY a single valid JSON object: no markdown, no code fences, no commentary,',
  'and every string value wrapped in double quotes. Use exactly these keys:',
  '- "summary": 2 to 3 sentences spoken directly to the user that welcome them back, cite their',
  '  real numbers, and (when a previous plan is given) say how they did since then.',
  '- "targetWeaknesses": array of 1 to 6 short lowercase weaknesses to focus on next, chosen ONLY',
  '  from the weaknesses and patterns listed below.',
  '- "goals": array of 1 to 4 goals. Each goal is {"metric","target","rationale"} where "metric" is',
  '  exactly "wpm" or "accuracy", "target" is one realistic number set slightly above the current',
  '  value for that metric (never below it), and "rationale" is one short sentence.',
  '- "recommendedDrills": array of up to 3 items, each {"weakness","difficulty"} where "weakness" is',
  '  one of the target weaknesses and "difficulty" is exactly "easy", "medium" or "hard".',
  'Base every claim only on the numbers and weaknesses provided. Do not invent stats, words, or',
  'progress the data does not support. Use only plain ASCII, no smart quotes, no markdown, and no',
  'dashes used in place of commas or parentheses.',
  'Return exactly this shape, with all string values quoted:',
  '{"summary":"Welcome back. Your average sits at 64 wpm with 93% accuracy, steady since last cycle. Let us push speed while protecting that accuracy.","targetWeaknesses":["double letters","ie/ei spelling"],"goals":[{"metric":"accuracy","target":95,"rationale":"You are close, so lock in clean keystrokes."},{"metric":"wpm","target":70,"rationale":"A small, steady bump from 64."}],"recommendedDrills":[{"weakness":"double letters","difficulty":"medium"}]}',
].join('\n');

/** Build the system + user prompt for the Planning step from the gathered context. */
export function buildPlanPrompt(ctx: PlanContext): {
  system: string;
  prompt: string;
} {
  const lines = [
    `WPM: current ${ctx.stats.currentWpm}, average ${ctx.stats.averageWpm}, best ${ctx.stats.bestWpm}`,
    `Average accuracy: ${ctx.stats.averageAccuracy}%`,
    `Diagnosed patterns: ${
      ctx.diagnosisPatterns.length > 0
        ? ctx.diagnosisPatterns.join(', ')
        : 'none recorded'
    }`,
    `Profile weaknesses: ${
      ctx.primaryWeaknesses.length > 0
        ? ctx.primaryWeaknesses.join(', ')
        : 'none recorded'
    }`,
    `Strengths (keep encouraging these): ${
      ctx.strengths.length > 0 ? ctx.strengths.join(', ') : 'none recorded'
    }`,
    `Preferred practice style: ${ctx.learningStyle ?? 'not specified'}`,
  ];

  if (ctx.previousPlan) {
    const goals =
      ctx.previousPlan.goals
        .map((g) => `${g.metric} target ${g.target}`)
        .join('; ') || 'none';
    lines.push(`Previous plan summary: ${ctx.previousPlan.summary}`);
    lines.push(`Previous plan goals: ${goals}`);
  } else {
    lines.push('Previous plan: none, this is the first cycle');
  }

  return { system: SYSTEM_PROMPT, prompt: lines.join('\n') };
}

/**
 * Parse and guard the model's JSON plan. Treats the output as untrusted: throws
 * PlanFormatError on bad JSON or a missing summary, and otherwise keeps only
 * well-formed goals (valid metric, finite in-range target), target weaknesses,
 * and recommended drills (known weakness, valid difficulty), each capped in count.
 */
export function parsePlanResponse(raw: string): ParsedPlan {
  const data = parseJsonLoosely(raw);
  if (typeof data !== 'object' || data === null) {
    throw new PlanFormatError('AI response was not a JSON object');
  }

  const obj = data as Record<string, unknown>;
  const summary = asText(obj.summary);
  if (!summary) {
    throw new PlanFormatError('AI response missing summary');
  }

  const targetWeaknesses = asTagArray(
    obj.targetWeaknesses,
    MAX_TARGET_WEAKNESSES,
  );

  return {
    summary: summary.slice(0, MAX_SUMMARY),
    targetWeaknesses,
    goals: parseGoals(obj.goals),
    recommendedDrills: parseDrills(obj.recommendedDrills, targetWeaknesses),
  };
}

/**
 * Compare the user's current stats to the previous plan. Pure math, no AI:
 * deltas use the stable averages (so one lucky session does not swing them) and
 * a goal counts as met when the matching current average reaches its target.
 */
export function evaluatePrevious(
  previousPlan: PreviousPlanForEval,
  currentStats: BenchmarkStats,
): PlanEvaluation {
  const wpmDelta = Math.round(
    currentStats.averageWpm - previousPlan.baseline.wpm,
  );
  const accuracyDelta =
    Math.round(
      (currentStats.averageAccuracy - previousPlan.baseline.accuracy) * 10,
    ) / 10;

  const metGoals: string[] = [];
  for (const goal of previousPlan.goals) {
    const current =
      goal.metric === 'wpm'
        ? currentStats.averageWpm
        : currentStats.averageAccuracy;
    if (current >= goal.target && !metGoals.includes(goal.metric)) {
      metGoals.push(goal.metric);
    }
  }

  return { wpmDelta, accuracyDelta, metGoals };
}

function parseGoals(value: unknown): PlanGoal[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const goals: PlanGoal[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }
    const g = item as Record<string, unknown>;
    const metric = g.metric;
    if (metric !== 'wpm' && metric !== 'accuracy') {
      continue;
    }
    const target = g.target;
    if (typeof target !== 'number' || !Number.isFinite(target)) {
      continue;
    }
    const [min, max] =
      metric === 'wpm' ? [WPM_MIN, WPM_MAX] : [ACCURACY_MIN, ACCURACY_MAX];
    if (target < min || target > max) {
      continue;
    }
    goals.push({
      metric,
      target: Math.round(target),
      rationale: (asText(g.rationale) ?? '').slice(0, MAX_RATIONALE),
    });
    if (goals.length >= MAX_GOALS) {
      break;
    }
  }
  return goals;
}

function parseDrills(
  value: unknown,
  allowedWeaknesses: string[],
): RecommendedDrill[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const allowed = new Set(allowedWeaknesses.map((w) => w.toLowerCase()));
  const drills: RecommendedDrill[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }
    const d = item as Record<string, unknown>;
    const weakness = asText(d.weakness);
    if (!weakness || !allowed.has(weakness.toLowerCase())) {
      continue;
    }
    if (!isDifficulty(d.difficulty)) {
      continue;
    }
    drills.push({
      weakness: weakness.slice(0, MAX_WEAKNESS_LEN),
      difficulty: d.difficulty,
    });
    if (drills.length >= MAX_DRILLS) {
      break;
    }
  }
  return drills;
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asTagArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, max)
    .map((item) => item.slice(0, MAX_WEAKNESS_LEN));
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
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // fall through to the error below
      }
    }
    throw new PlanFormatError('AI response was not valid JSON');
  }
}

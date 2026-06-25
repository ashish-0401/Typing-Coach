/**
 * Pure helpers for the coach: building the grounded system prompt and capping the
 * message window sent to the model. Kept free of Nest/Mongoose so they are
 * trivially unit-testable with no network.
 */

export interface CoachContext {
  currentWpm: number;
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  plateauDetected: boolean;
  weaknesses: string[];
  strengths: string[];
  learningStyle: string | null;
  /** Pre-formatted milestone labels, most recent first. */
  milestones: string[];
  diagnosisSummary: string | null;
  diagnosisReasoning: string | null;
  diagnosisPatterns: string[];
  /** Recent WPM, oldest to newest. */
  recentWpm: number[];
}

/** Build the coach's system prompt, grounded only in the user's real data. */
export function buildCoachSystemPrompt(ctx: CoachContext): string {
  const lines: string[] = [
    "You are WazaKey's typing coach: encouraging, concrete, and brief.",
    "Use ONLY the data below. Never invent numbers or facts. Cite the user's real numbers and progress.",
    'Keep replies to 2 to 4 short sentences, and when useful suggest one concrete next step or drill.',
    '',
    'User data:',
    `- Sessions: ${ctx.totalSessions}; current ${ctx.currentWpm} WPM, average ${ctx.averageWpm}, best ${ctx.bestWpm}.`,
    `- Average accuracy: ${ctx.averageAccuracy}%. Plateaued: ${ctx.plateauDetected ? 'yes' : 'no'}.`,
    `- Most mistyped words: ${
      ctx.weaknesses.length > 0 ? ctx.weaknesses.join(', ') : 'none recorded'
    }.`,
  ];

  if (ctx.strengths.length > 0) {
    lines.push(`- Strengths: ${ctx.strengths.join(', ')}.`);
  }
  if (ctx.learningStyle) {
    lines.push(`- Learning style: ${ctx.learningStyle}.`);
  }
  if (ctx.milestones.length > 0) {
    lines.push(`- Recent milestones: ${ctx.milestones.join(', ')}.`);
  }
  if (ctx.diagnosisSummary) {
    lines.push(`- Latest diagnosis: ${ctx.diagnosisSummary}`);
    if (ctx.diagnosisReasoning) {
      lines.push(`  Reasoning: ${ctx.diagnosisReasoning}`);
    }
    if (ctx.diagnosisPatterns.length > 0) {
      lines.push(`  Patterns: ${ctx.diagnosisPatterns.join(', ')}.`);
    }
  }
  if (ctx.recentWpm.length > 0) {
    lines.push(`- Recent WPM (old to new): ${ctx.recentWpm.join(', ')}.`);
  }

  return lines.join('\n');
}

/** Keep only the most recent `limit` items (caps the chat window sent to the model). */
export function capHistory<T>(items: readonly T[], limit: number): T[] {
  if (limit <= 0) {
    return [];
  }
  return items.length <= limit ? [...items] : items.slice(items.length - limit);
}

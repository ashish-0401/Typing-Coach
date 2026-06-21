/**
 * Pure derivation of a learning profile's numeric stats and weaknesses from a
 * user's typing sessions. Kept separate from the service (and Mongoose) so the
 * recompute math is trivially unit-testable.
 */

/** Minimal shape this module needs from a TypingSession. */
export interface SessionMetricsInput {
  wpm: number;
  accuracy: number;
  mistakes: string[];
}

export interface ComputedProfileMetrics {
  currentWpm: number;
  bestWpm: number;
  averageWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  primaryWeaknesses: string[];
  plateauDetected: boolean;
}

/** How many top mistyped words to keep as primary weaknesses. */
export const MAX_PRIMARY_WEAKNESSES = 5;

/** How many recent sessions the plateau heuristic looks at. */
export const PLATEAU_WINDOW = 5;

const EMPTY_METRICS: ComputedProfileMetrics = {
  currentWpm: 0,
  bestWpm: 0,
  averageWpm: 0,
  averageAccuracy: 0,
  totalSessions: 0,
  primaryWeaknesses: [],
  plateauDetected: false,
};

/**
 * Derive profile stats from a user's sessions.
 *
 * `sessions` MUST be ordered newest-first (index 0 is the latest session),
 * matching `SessionsService.findByUser`.
 */
export function computeProfileMetrics(
  sessions: readonly SessionMetricsInput[],
): ComputedProfileMetrics {
  const totalSessions = sessions.length;
  if (totalSessions === 0) {
    return { ...EMPTY_METRICS };
  }

  const wpmValues = sessions.map((s) => s.wpm);

  // Newest-first ordering means index 0 is the most recent session.
  const currentWpm = wpmValues[0];
  const bestWpm = Math.max(...wpmValues);
  const averageWpm = Math.round(sum(wpmValues) / totalSessions);

  const accuracySum = sum(sessions.map((s) => s.accuracy));
  const averageAccuracy = Math.round((accuracySum / totalSessions) * 10) / 10;

  return {
    currentWpm,
    bestWpm,
    averageWpm,
    averageAccuracy,
    totalSessions,
    primaryWeaknesses: topMistakes(sessions, MAX_PRIMARY_WEAKNESSES),
    plateauDetected: detectPlateau(wpmValues, PLATEAU_WINDOW),
  };
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Most frequently mistyped words across all sessions, most frequent first.
 * Ties keep first-encountered order (sessions are newest-first), so recent
 * recurring mistakes win ties.
 */
function topMistakes(
  sessions: readonly SessionMetricsInput[],
  limit: number,
): string[] {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    for (const word of session.mistakes) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  // Array.prototype.sort is stable, so equal counts keep insertion order.
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Simple plateau heuristic: with more than `window` sessions, a plateau means
 * the most recent `window` sessions did not beat the best WPM achieved before
 * them (no new personal record recently). With `window` or fewer sessions there
 * is not enough history, so it is never a plateau.
 *
 * `wpmValues` is newest-first.
 */
function detectPlateau(wpmValues: readonly number[], window: number): boolean {
  if (wpmValues.length <= window) {
    return false;
  }

  const recentBest = Math.max(...wpmValues.slice(0, window));
  const priorBest = Math.max(...wpmValues.slice(window));
  return recentBest <= priorBest;
}

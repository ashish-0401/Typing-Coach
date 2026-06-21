/**
 * Pure, rule-based milestone detection (no AI). Kept separate from the service
 * (and Mongoose) so the award/de-duplication logic is trivially unit-testable.
 */

export type MilestoneType =
  | 'session_count'
  | 'wpm_threshold'
  | 'best_wpm'
  | 'accuracy';

export interface DetectedMilestone {
  type: MilestoneType;
  value: number;
  achievedAt: Date;
}

export interface MilestoneSignals {
  /** All-time best WPM after the latest session. */
  bestWpm: number;
  /** Best WPM recorded before this recompute (0 when there was no profile yet). */
  previousBestWpm: number;
  /** Best single-session accuracy across all sessions. */
  bestAccuracy: number;
  /** Total saved sessions after the latest one. */
  totalSessions: number;
  /** Milestones the user already holds, used to avoid re-awarding. */
  existingMilestones: ReadonlyArray<{ type: string; value: number }>;
}

/** WPM levels that each award a one-time milestone when first reached. */
export const WPM_THRESHOLDS = [40, 60, 80, 100];

/** Session-count streaks that each award a one-time milestone. */
export const SESSION_COUNT_MILESTONES = [1, 10, 25, 50];

/** Minimum single-session accuracy (percent) for the accuracy milestone. */
export const ACCURACY_MILESTONE = 95;

/**
 * Return milestones newly earned by the latest session, skipping any the user
 * already holds. Callers should prepend these to the stored list so it stays
 * newest-first.
 */
export function detectNewMilestones(
  signals: MilestoneSignals,
  now: Date = new Date(),
): DetectedMilestone[] {
  const awarded = new Set(
    signals.existingMilestones.map((m) => `${m.type}:${m.value}`),
  );
  const fresh: DetectedMilestone[] = [];

  const award = (type: MilestoneType, value: number): void => {
    const key = `${type}:${value}`;
    if (!awarded.has(key)) {
      awarded.add(key);
      fresh.push({ type, value, achievedAt: now });
    }
  };

  // Session-count streaks.
  for (const count of SESSION_COUNT_MILESTONES) {
    if (signals.totalSessions >= count) {
      award('session_count', count);
    }
  }

  // WPM thresholds, based on the all-time best.
  for (const threshold of WPM_THRESHOLDS) {
    if (signals.bestWpm >= threshold) {
      award('wpm_threshold', threshold);
    }
  }

  // A new personal-best WPM, only once there is a prior best to beat (so the
  // very first session is covered by the session-count / threshold milestones).
  if (
    signals.previousBestWpm > 0 &&
    signals.bestWpm > signals.previousBestWpm
  ) {
    award('best_wpm', signals.bestWpm);
  }

  // A high-accuracy run.
  if (signals.bestAccuracy >= ACCURACY_MILESTONE) {
    award('accuracy', ACCURACY_MILESTONE);
  }

  return fresh;
}

import type { Milestone } from './api';

/** Human-readable label for a milestone, e.g. "80 WPM" or "First session". */
export function milestoneLabel(milestone: Milestone): string {
  switch (milestone.type) {
    case 'best_wpm':
      return `${milestone.value} WPM personal best`;
    case 'wpm_threshold':
      return `${milestone.value} WPM`;
    case 'accuracy':
      return `${milestone.value}% accuracy`;
    case 'session_count':
      return milestone.value === 1 ? 'First session' : `${milestone.value} sessions`;
    default:
      return String(milestone.value);
  }
}

// Higher wins when several milestones are earned at once (we only toast one).
const TOAST_PRIORITY: Record<string, number> = {
  best_wpm: 4,
  wpm_threshold: 3,
  accuracy: 2,
  session_count: 1,
};

/** Pick the most noteworthy milestone to surface, or null if there are none. */
export function pickTopMilestone(milestones: Milestone[]): Milestone | null {
  if (milestones.length === 0) {
    return null;
  }
  return [...milestones].sort((a, b) => {
    const priorityDiff = (TOAST_PRIORITY[b.type] ?? 0) - (TOAST_PRIORITY[a.type] ?? 0);
    return priorityDiff !== 0 ? priorityDiff : b.value - a.value;
  })[0];
}

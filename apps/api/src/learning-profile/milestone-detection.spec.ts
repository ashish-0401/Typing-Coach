import {
  ACCURACY_MILESTONE,
  detectNewMilestones,
  type MilestoneSignals,
} from './milestone-detection';

const NOW = new Date('2026-06-21T00:00:00.000Z');

function signals(overrides: Partial<MilestoneSignals> = {}): MilestoneSignals {
  return {
    bestWpm: 0,
    previousBestWpm: 0,
    bestAccuracy: 0,
    totalSessions: 0,
    existingMilestones: [],
    ...overrides,
  };
}

describe('detectNewMilestones', () => {
  it('awards first-session and crossed thresholds, not unmet ones', () => {
    const result = detectNewMilestones(
      signals({ bestWpm: 50, previousBestWpm: 0, bestAccuracy: 90, totalSessions: 1 }),
      NOW,
    );

    // session_count:1 and wpm_threshold:40 only (50 < 60, no prior best, 90 < 95).
    expect(result).toEqual([
      { type: 'session_count', value: 1, achievedAt: NOW },
      { type: 'wpm_threshold', value: 40, achievedAt: NOW },
    ]);
  });

  it('does not re-award milestones the user already holds', () => {
    const result = detectNewMilestones(
      signals({
        bestWpm: 50,
        totalSessions: 1,
        existingMilestones: [
          { type: 'session_count', value: 1 },
          { type: 'wpm_threshold', value: 40 },
        ],
      }),
      NOW,
    );

    expect(result).toEqual([]);
  });

  it('awards a new personal best only when it beats a prior best', () => {
    const result = detectNewMilestones(
      signals({
        bestWpm: 70,
        previousBestWpm: 60,
        totalSessions: 5,
        existingMilestones: [
          { type: 'session_count', value: 1 },
          { type: 'wpm_threshold', value: 40 },
          { type: 'wpm_threshold', value: 60 },
        ],
      }),
      NOW,
    );

    expect(result).toEqual([{ type: 'best_wpm', value: 70, achievedAt: NOW }]);
  });

  it('awards every newly crossed WPM threshold', () => {
    const result = detectNewMilestones(
      signals({ bestWpm: 100, previousBestWpm: 0, totalSessions: 1 }),
      NOW,
    );

    const thresholds = result
      .filter((m) => m.type === 'wpm_threshold')
      .map((m) => m.value);
    expect(thresholds).toEqual([40, 60, 80, 100]);
  });

  it('awards the accuracy milestone once a session reaches the cutoff', () => {
    const result = detectNewMilestones(
      signals({ bestWpm: 30, totalSessions: 1, bestAccuracy: 96 }),
      NOW,
    );

    expect(result).toContainEqual({
      type: 'accuracy',
      value: ACCURACY_MILESTONE,
      achievedAt: NOW,
    });
  });

  it('awards session-count streaks as they are reached', () => {
    const result = detectNewMilestones(
      signals({
        bestWpm: 50,
        totalSessions: 10,
        existingMilestones: [
          { type: 'session_count', value: 1 },
          { type: 'wpm_threshold', value: 40 },
        ],
      }),
      NOW,
    );

    expect(result).toEqual([{ type: 'session_count', value: 10, achievedAt: NOW }]);
  });
});

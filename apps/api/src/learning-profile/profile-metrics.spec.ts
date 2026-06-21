import {
  computeProfileMetrics,
  MAX_PRIMARY_WEAKNESSES,
  PLATEAU_WINDOW,
  type SessionMetricsInput,
} from './profile-metrics';

/** Build a newest-first session list from WPM values (accuracy/mistakes optional). */
function sessionsFromWpm(wpmNewestFirst: number[]): SessionMetricsInput[] {
  return wpmNewestFirst.map((wpm) => ({ wpm, accuracy: 100, mistakes: [] }));
}

describe('computeProfileMetrics', () => {
  it('returns zeroed metrics for no sessions', () => {
    expect(computeProfileMetrics([])).toEqual({
      currentWpm: 0,
      bestWpm: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      totalSessions: 0,
      primaryWeaknesses: [],
      plateauDetected: false,
    });
  });

  it('uses the newest session for currentWpm and the max for bestWpm', () => {
    // Newest-first: latest session is 60, peak is 80.
    const sessions: SessionMetricsInput[] = [
      { wpm: 60, accuracy: 90, mistakes: ['the', 'quick'] },
      { wpm: 80, accuracy: 95, mistakes: ['the', 'fox'] },
      { wpm: 70, accuracy: 100, mistakes: ['the'] },
    ];

    const result = computeProfileMetrics(sessions);

    expect(result.currentWpm).toBe(60);
    expect(result.bestWpm).toBe(80);
    expect(result.averageWpm).toBe(70); // (60 + 80 + 70) / 3
    expect(result.averageAccuracy).toBe(95); // (90 + 95 + 100) / 3
    expect(result.totalSessions).toBe(3);
  });

  it('rounds averageWpm to an integer and averageAccuracy to one decimal', () => {
    const sessions: SessionMetricsInput[] = [
      { wpm: 50, accuracy: 90, mistakes: [] },
      { wpm: 51, accuracy: 91, mistakes: [] },
    ];

    const result = computeProfileMetrics(sessions);

    expect(result.averageWpm).toBe(51); // 50.5 rounds up
    expect(result.averageAccuracy).toBe(90.5); // one decimal preserved
  });

  it('ranks primary weaknesses by frequency, most frequent first', () => {
    const sessions: SessionMetricsInput[] = [
      { wpm: 60, accuracy: 95, mistakes: ['the', 'quick'] },
      { wpm: 62, accuracy: 96, mistakes: ['the', 'fox'] },
      { wpm: 64, accuracy: 97, mistakes: ['the', 'quick'] },
    ];

    // the=3, quick=2, fox=1
    expect(computeProfileMetrics(sessions).primaryWeaknesses).toEqual([
      'the',
      'quick',
      'fox',
    ]);
  });

  it('caps primary weaknesses at MAX_PRIMARY_WEAKNESSES', () => {
    const sessions: SessionMetricsInput[] = [
      {
        wpm: 60,
        accuracy: 95,
        mistakes: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      },
    ];

    const weaknesses = computeProfileMetrics(sessions).primaryWeaknesses;

    expect(weaknesses).toHaveLength(MAX_PRIMARY_WEAKNESSES);
    expect(weaknesses).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('does not flag a plateau without enough history', () => {
    // Exactly PLATEAU_WINDOW sessions is not enough to compare against a prior window.
    const sessions = sessionsFromWpm(
      Array.from({ length: PLATEAU_WINDOW }, (_unused, i) => 50 + i),
    );

    expect(computeProfileMetrics(sessions).plateauDetected).toBe(false);
  });

  it('flags a plateau when recent sessions beat no prior personal record', () => {
    // Newest-first: last 5 sessions peak at 74, but an older session hit 90.
    const sessions = sessionsFromWpm([70, 71, 72, 73, 74, 90]);

    expect(computeProfileMetrics(sessions).plateauDetected).toBe(true);
  });

  it('does not flag a plateau when a recent session sets a new record', () => {
    // Newest-first: a recent session (95) beats the prior best (90).
    const sessions = sessionsFromWpm([95, 71, 72, 73, 74, 90]);

    expect(computeProfileMetrics(sessions).plateauDetected).toBe(false);
  });
});

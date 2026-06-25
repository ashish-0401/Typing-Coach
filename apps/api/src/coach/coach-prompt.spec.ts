import {
  buildCoachSystemPrompt,
  capHistory,
  type CoachContext,
} from './coach-prompt';

const base: CoachContext = {
  currentWpm: 67,
  averageWpm: 64,
  bestWpm: 72,
  averageAccuracy: 92,
  totalSessions: 24,
  plateauDetected: false,
  weaknesses: ['receive', 'believe'],
  strengths: [],
  learningStyle: null,
  milestones: [],
  diagnosisSummary: null,
  diagnosisReasoning: null,
  diagnosisPatterns: [],
  recentWpm: [],
};

describe('buildCoachSystemPrompt', () => {
  it('includes the core stats and weaknesses, and the grounding rule', () => {
    const prompt = buildCoachSystemPrompt(base);
    expect(prompt).toContain('24'); // sessions
    expect(prompt).toContain('67 WPM'); // current
    expect(prompt).toContain('92%'); // accuracy
    expect(prompt).toContain('receive');
    expect(prompt.toLowerCase()).toContain('only the data');
  });

  it('omits optional sections when there is no data for them', () => {
    const prompt = buildCoachSystemPrompt(base);
    expect(prompt).not.toContain('Strengths:');
    expect(prompt).not.toContain('Learning style:');
    expect(prompt).not.toContain('Latest diagnosis:');
    expect(prompt).not.toContain('Recent milestones:');
  });

  it('includes diagnosis, strengths, milestones and trend when present', () => {
    const prompt = buildCoachSystemPrompt({
      ...base,
      strengths: ['steady rhythm'],
      learningStyle: 'short drills',
      diagnosisSummary: 'You struggle with ie/ei words.',
      diagnosisReasoning: 'Errors cluster on receive and believe.',
      diagnosisPatterns: ['ie/ei spelling'],
      milestones: ['reached 60 WPM'],
      recentWpm: [60, 63, 67],
    });
    expect(prompt).toContain('steady rhythm');
    expect(prompt).toContain('short drills');
    expect(prompt).toContain('You struggle with ie/ei words.');
    expect(prompt).toContain('ie/ei spelling');
    expect(prompt).toContain('reached 60 WPM');
    expect(prompt).toContain('60, 63, 67');
  });
});

describe('capHistory', () => {
  it('returns all items when within the limit', () => {
    expect(capHistory([1, 2, 3], 5)).toEqual([1, 2, 3]);
  });

  it('keeps only the most recent items', () => {
    expect(capHistory([1, 2, 3, 4, 5], 2)).toEqual([4, 5]);
  });

  it('returns nothing for a non-positive limit', () => {
    expect(capHistory([1, 2, 3], 0)).toEqual([]);
  });
});

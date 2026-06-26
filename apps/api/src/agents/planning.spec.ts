import {
  buildPlanPrompt,
  evaluatePrevious,
  parsePlanResponse,
  PlanFormatError,
  type BenchmarkStats,
  type PlanContext,
} from './planning';

const stats: BenchmarkStats = {
  currentWpm: 66,
  bestWpm: 78,
  averageWpm: 64,
  averageAccuracy: 92.5,
};

const context: PlanContext = {
  stats,
  diagnosisPatterns: ['double letters', 'ie/ei spelling'],
  primaryWeaknesses: ['double letters'],
  strengths: ['steady rhythm'],
  learningStyle: 'short focused drills',
  previousPlan: {
    summary: 'Last time we focused on accuracy.',
    goals: [{ metric: 'accuracy', target: 93, rationale: 'lock it in' }],
  },
};

describe('buildPlanPrompt', () => {
  it('asks for JSON, names the shape, and includes the real stats', () => {
    const { system, prompt } = buildPlanPrompt(context);

    expect(system.toLowerCase()).toContain('json');
    expect(system).toContain('targetWeaknesses');
    expect(system).toContain('recommendedDrills');
    expect(prompt).toContain('64'); // average wpm
    expect(prompt).toContain('92.5'); // average accuracy
    expect(prompt).toContain('double letters');
    expect(prompt).toContain('Last time we focused on accuracy.'); // continuity
  });

  it('notes when there is no previous plan', () => {
    const { prompt } = buildPlanPrompt({ ...context, previousPlan: null });
    expect(prompt.toLowerCase()).toContain('first cycle');
  });
});

describe('parsePlanResponse', () => {
  it('parses a good plan and keeps the valid goals and drills', () => {
    const raw = JSON.stringify({
      summary: '  Welcome back, your accuracy is climbing.  ',
      targetWeaknesses: ['double letters', 'ie/ei spelling', ''],
      goals: [
        { metric: 'accuracy', target: 95, rationale: 'lock it in' },
        { metric: 'wpm', target: 70, rationale: 'steady bump' },
      ],
      recommendedDrills: [{ weakness: 'double letters', difficulty: 'medium' }],
    });

    const plan = parsePlanResponse(raw);

    expect(plan.summary).toBe('Welcome back, your accuracy is climbing.');
    expect(plan.targetWeaknesses).toEqual(['double letters', 'ie/ei spelling']);
    expect(plan.goals).toHaveLength(2);
    expect(plan.goals[0]).toEqual({
      metric: 'accuracy',
      target: 95,
      rationale: 'lock it in',
    });
    expect(plan.recommendedDrills).toEqual([
      { weakness: 'double letters', difficulty: 'medium' },
    ]);
  });

  it('drops goals with an invalid metric or out-of-range target', () => {
    const raw = JSON.stringify({
      summary: 'Mixed bag of goals.',
      targetWeaknesses: ['double letters'],
      goals: [
        { metric: 'accuracy', target: 96, rationale: 'ok' },
        { metric: 'wpm', target: 9999, rationale: 'too fast' },
        { metric: 'stamina', target: 5, rationale: 'not a metric' },
      ],
      recommendedDrills: [],
    });

    const plan = parsePlanResponse(raw);

    expect(plan.goals).toEqual([
      { metric: 'accuracy', target: 96, rationale: 'ok' },
    ]);
  });

  it('drops a recommended drill for an unknown weakness or bad difficulty', () => {
    const raw = JSON.stringify({
      summary: 'Drills test.',
      targetWeaknesses: ['double letters'],
      goals: [{ metric: 'wpm', target: 70, rationale: 'go' }],
      recommendedDrills: [
        { weakness: 'double letters', difficulty: 'hard' },
        { weakness: 'unicorns', difficulty: 'easy' },
        { weakness: 'double letters', difficulty: 'sideways' },
      ],
    });

    const plan = parsePlanResponse(raw);

    expect(plan.recommendedDrills).toEqual([
      { weakness: 'double letters', difficulty: 'hard' },
    ]);
  });

  it('clamps counts to their caps', () => {
    const raw = JSON.stringify({
      summary: 'Lots of everything.',
      targetWeaknesses: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      goals: [
        { metric: 'wpm', target: 60, rationale: '1' },
        { metric: 'wpm', target: 62, rationale: '2' },
        { metric: 'wpm', target: 64, rationale: '3' },
        { metric: 'wpm', target: 66, rationale: '4' },
        { metric: 'wpm', target: 68, rationale: '5' },
      ],
      recommendedDrills: [
        { weakness: 'a', difficulty: 'easy' },
        { weakness: 'b', difficulty: 'easy' },
        { weakness: 'c', difficulty: 'easy' },
        { weakness: 'd', difficulty: 'easy' },
      ],
    });

    const plan = parsePlanResponse(raw);

    expect(plan.targetWeaknesses).toHaveLength(6);
    expect(plan.goals).toHaveLength(4);
    expect(plan.recommendedDrills).toHaveLength(3);
  });

  it('throws PlanFormatError on malformed JSON', () => {
    expect(() => parsePlanResponse('not json')).toThrow(PlanFormatError);
  });

  it('throws PlanFormatError when the summary is missing', () => {
    const raw = JSON.stringify({
      targetWeaknesses: ['x'],
      goals: [],
      recommendedDrills: [],
    });
    expect(() => parsePlanResponse(raw)).toThrow(PlanFormatError);
  });
});

describe('evaluatePrevious', () => {
  it('computes deltas and which goals were met', () => {
    const evaluation = evaluatePrevious(
      {
        baseline: { wpm: 60, accuracy: 90 },
        goals: [
          { metric: 'accuracy', target: 92, rationale: '' },
          { metric: 'wpm', target: 70, rationale: '' },
        ],
      },
      stats, // averageWpm 64, averageAccuracy 92.5
    );

    expect(evaluation.wpmDelta).toBe(4); // 64 - 60
    expect(evaluation.accuracyDelta).toBe(2.5); // 92.5 - 90
    expect(evaluation.metGoals).toEqual(['accuracy']);
  });

  it('reports a negative wpm delta and no met goals when the user slipped', () => {
    const evaluation = evaluatePrevious(
      {
        baseline: { wpm: 70, accuracy: 95 },
        goals: [{ metric: 'wpm', target: 75, rationale: '' }],
      },
      { currentWpm: 0, bestWpm: 0, averageWpm: 64, averageAccuracy: 92.5 },
    );

    expect(evaluation.wpmDelta).toBe(-6); // 64 - 70
    expect(evaluation.accuracyDelta).toBe(-2.5); // 92.5 - 95
    expect(evaluation.metGoals).toEqual([]);
  });
});

import {
  BadRequestException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { AgentsService } from './agents.service';
import {
  AnalyticsService,
  type AnalyticsSummary,
} from '../analytics/analytics.service';
import { LearningProfileService } from '../learning-profile/learning-profile.service';
import { DiagnosisService } from '../learning-profile/diagnosis.service';
import { AiService } from '../ai/ai.service';
import { TrainingPlanDocument } from './schemas/training-plan.schema';

const GOOD_PLAN_RESPONSE = JSON.stringify({
  summary:
    'Welcome back. Your average is 64 wpm at 92.5% accuracy. Let us push speed while keeping that accuracy.',
  targetWeaknesses: ['double letters'],
  goals: [
    { metric: 'accuracy', target: 95, rationale: 'lock in clean keystrokes' },
    { metric: 'wpm', target: 70, rationale: 'a small, steady bump' },
  ],
  recommendedDrills: [{ weakness: 'double letters', difficulty: 'medium' }],
});

const STATS: AnalyticsSummary = {
  currentWpm: 66,
  averageWpm: 64,
  bestWpm: 78,
  averageAccuracy: 92.5,
  totalSessions: 12,
  trend: [],
};

const PROFILE = {
  primaryWeaknesses: ['double letters'],
  strengths: ['steady rhythm'],
  learningStyle: 'short focused drills',
  totalSessions: 12,
};

// basedOnSessions matches the current total, so the cycle should reuse it.
const FRESH_DIAGNOSIS = {
  _id: 'diag-1',
  patterns: ['double letters'],
  basedOnSessions: 12,
};

const PREVIOUS_PLAN = {
  _id: 'plan-prev',
  summary: 'Last cycle we focused on accuracy.',
  goals: [{ metric: 'accuracy', target: 92, rationale: 'build a clean base' }],
  baseline: { wpm: 60, accuracy: 90 },
};

interface Overrides {
  stats?: Partial<AnalyticsSummary>;
  latestDiagnosis?: unknown;
  previousPlan?: unknown;
  complete?: jest.Mock;
}

interface Mocks {
  create: jest.Mock;
  summary: jest.Mock;
  getByUser: jest.Mock;
  getLatest: jest.Mock;
  diagnose: jest.Mock;
  complete: jest.Mock;
}

/** A minimal Mongoose query chain: `.sort().exec()` resolving to `result`. */
function chain(result: unknown) {
  return { sort: () => ({ exec: () => Promise.resolve(result) }) };
}

function makeService(overrides: Overrides = {}): {
  service: AgentsService;
  mocks: Mocks;
} {
  const create = jest
    .fn()
    .mockImplementation((doc: Record<string, unknown>) =>
      Promise.resolve({ _id: 'plan-new', ...doc }),
    );
  const previousPlan =
    overrides.previousPlan === undefined
      ? PREVIOUS_PLAN
      : overrides.previousPlan;
  const planModel = {
    create,
    findOne: jest.fn().mockReturnValue(chain(previousPlan)),
    find: jest.fn().mockReturnValue(chain([])),
  } as unknown as Model<TrainingPlanDocument>;

  const summary = jest.fn().mockResolvedValue({ ...STATS, ...overrides.stats });
  const analytics = { summary } as unknown as AnalyticsService;

  const getByUser = jest.fn().mockResolvedValue(PROFILE);
  const profiles = { getByUser } as unknown as LearningProfileService;

  const latestDiagnosis =
    overrides.latestDiagnosis === undefined
      ? FRESH_DIAGNOSIS
      : overrides.latestDiagnosis;
  const getLatest = jest.fn().mockResolvedValue(latestDiagnosis);
  const diagnose = jest.fn().mockResolvedValue({
    _id: 'diag-new',
    patterns: ['fresh pattern'],
    basedOnSessions: 12,
  });
  const diagnoses = { getLatest, diagnose } as unknown as DiagnosisService;

  const complete =
    overrides.complete ?? jest.fn().mockResolvedValue(GOOD_PLAN_RESPONSE);
  const ai = { model: 'test-model', complete } as unknown as AiService;

  const service = new AgentsService(
    planModel,
    analytics,
    profiles,
    diagnoses,
    ai,
  );
  return {
    service,
    mocks: { create, summary, getByUser, getLatest, diagnose, complete },
  };
}

describe('AgentsService.runCoachingCycle', () => {
  it('rejects with BadRequestException when there are too few real sessions', async () => {
    const { service, mocks } = makeService({ stats: { totalSessions: 1 } });

    await expect(service.runCoachingCycle('u1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('persists the planned output with the model id and previous plan id', async () => {
    const { service, mocks } = makeService();

    const plan = await service.runCoachingCycle('u1');

    expect(mocks.complete).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        summary: expect.stringContaining('Welcome back') as unknown,
        targetWeaknesses: ['double letters'],
        aiModel: 'test-model',
        basedOnDiagnosisId: 'diag-1',
        previousPlanId: 'plan-prev',
        // baseline is captured from the current averages, for the next cycle.
        baseline: { wpm: 64, accuracy: 92.5 },
      }),
    );
    expect(plan).toMatchObject({ _id: 'plan-new', userId: 'u1' });
  });

  it('reuses a fresh diagnosis instead of spending an AI call on a new one', async () => {
    const { service, mocks } = makeService();

    await service.runCoachingCycle('u1');

    expect(mocks.diagnose).not.toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ basedOnDiagnosisId: 'diag-1' }),
    );
  });

  it('runs a new diagnosis when the latest one is stale', async () => {
    const { service, mocks } = makeService({
      latestDiagnosis: {
        _id: 'diag-old',
        patterns: ['old'],
        basedOnSessions: 2,
      },
    });

    await service.runCoachingCycle('u1');

    expect(mocks.diagnose).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ basedOnDiagnosisId: 'diag-new' }),
    );
  });

  it('evaluates the previous plan with pure math (deltas and met goals)', async () => {
    const { service, mocks } = makeService();

    await service.runCoachingCycle('u1');

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        evaluation: { wpmDelta: 4, accuracyDelta: 2.5, metGoals: ['accuracy'] },
      }),
    );
  });

  it('has no evaluation on the very first cycle (no previous plan)', async () => {
    const { service, mocks } = makeService({ previousPlan: null });

    await service.runCoachingCycle('u1');

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ evaluation: null, previousPlanId: null }),
    );
  });

  it('maps an AI failure to a ServiceUnavailableException and logs the cause', async () => {
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const complete = jest.fn().mockRejectedValue(new Error('network down'));
    const { service, mocks } = makeService({ complete });

    await expect(service.runCoachingCycle('u1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('network down'));
    expect(mocks.create).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it('maps an unparseable AI response to a ServiceUnavailableException', async () => {
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const complete = jest.fn().mockResolvedValue('not json at all');
    const { service, mocks } = makeService({ complete });

    await expect(service.runCoachingCycle('u1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(mocks.create).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});

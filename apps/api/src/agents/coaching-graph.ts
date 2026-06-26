/**
 * The Phase 6 coaching cycle as a LangGraph state machine. LangGraph owns the
 * control flow ONLY; every Groq call still goes through the injected AiService,
 * so the provider stays replaceable and the free-tier budget stays visible. Each
 * node is a thin wrapper over an existing service, and the heavy lifting
 * (metrics, diagnosis, planning math) lives in those services and the pure
 * planning core, not here.
 */

import {
  BadRequestException,
  ServiceUnavailableException,
  type Logger,
} from '@nestjs/common';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import type {
  AnalyticsService,
  AnalyticsSummary,
} from '../analytics/analytics.service';
import type { LearningProfileService } from '../learning-profile/learning-profile.service';
import type { LearningProfileDocument } from '../learning-profile/schemas/learning-profile.schema';
import type { DiagnosisService } from '../learning-profile/diagnosis.service';
import type { DiagnosisDocument } from '../learning-profile/schemas/diagnosis.schema';
import type { AiService } from '../ai/ai.service';
import {
  buildPlanPrompt,
  evaluatePrevious,
  parsePlanResponse,
  type ParsedPlan,
  type PlanEvaluation,
} from './planning';
import type { TrainingPlanDocument } from './schemas/training-plan.schema';

// Enough real (non-drill) sessions before a cycle can run, mirroring the
// diagnosis minimum so the plan is grounded in enough data.
const MIN_SESSIONS_FOR_CYCLE = 3;
// Reuse the latest diagnosis unless this many new real sessions have landed
// since it was made. Below the threshold, re-diagnosing would just spend an AI
// call to reach the same conclusion.
const STALE_DIAGNOSIS_SESSION_DELTA = 5;

/** The live services each node leans on. Injected so the graph stays testable. */
export interface CoachingDeps {
  analytics: AnalyticsService;
  profiles: LearningProfileService;
  diagnoses: DiagnosisService;
  ai: AiService;
  /** Loads the user's most recent stored plan (AgentsService owns the model). */
  latestPlan: (userId: string) => Promise<TrainingPlanDocument | null>;
  logger: Logger;
}

/** The graph's shared, typed state. Each node fills in the fields it owns. */
export const CoachingStateAnnotation = Annotation.Root({
  userId: Annotation<string>(),
  stats: Annotation<AnalyticsSummary>(),
  profile: Annotation<LearningProfileDocument>(),
  latestDiagnosis: Annotation<DiagnosisDocument | null>(),
  diagnosisPatterns: Annotation<string[]>(),
  basedOnDiagnosisId: Annotation<string | null>(),
  previousPlan: Annotation<TrainingPlanDocument | null>(),
  plan: Annotation<ParsedPlan | null>(),
  evaluation: Annotation<PlanEvaluation | null>(),
  generatedDrillId: Annotation<string | null>(),
});

export type CoachingState = typeof CoachingStateAnnotation.State;

/** Wire the six coaching nodes into a compiled, runnable graph. */
export function buildCoachingGraph(deps: CoachingDeps) {
  const { analytics, profiles, diagnoses, ai, latestPlan, logger } = deps;

  // Observation: load the real benchmark (drills excluded). Stop early, with a
  // friendly message, when there is not enough real history to plan from.
  const observation = async (
    state: CoachingState,
  ): Promise<Partial<CoachingState>> => {
    const stats = await analytics.summary(state.userId);
    if (stats.totalSessions < MIN_SESSIONS_FOR_CYCLE) {
      throw new BadRequestException(
        `Finish at least ${MIN_SESSIONS_FOR_CYCLE} typing tests so I can build a plan for you.`,
      );
    }
    return { stats };
  };

  // Memory: pull the long-term context the rest of the cycle reasons over: the
  // profile (with its milestones), the latest diagnosis, and the previous plan.
  const memory = async (
    state: CoachingState,
  ): Promise<Partial<CoachingState>> => {
    const [profile, latestDiagnosis, previousPlan] = await Promise.all([
      profiles.getByUser(state.userId),
      diagnoses.getLatest(state.userId),
      latestPlan(state.userId),
    ]);
    return { profile, latestDiagnosis, previousPlan };
  };

  // Diagnosis: reuse a recent diagnosis when little has changed; only spend an
  // AI call on a fresh one when the latest is stale (or absent).
  const diagnosis = async (
    state: CoachingState,
  ): Promise<Partial<CoachingState>> => {
    const latest = state.latestDiagnosis;
    const isFresh =
      latest !== null &&
      state.stats.totalSessions - latest.basedOnSessions <
        STALE_DIAGNOSIS_SESSION_DELTA;
    if (latest && isFresh) {
      return {
        diagnosisPatterns: latest.patterns,
        basedOnDiagnosisId: String(latest._id),
      };
    }
    const created = await diagnoses.diagnose(state.userId);
    return {
      diagnosisPatterns: created.patterns,
      basedOnDiagnosisId: String(created._id),
    };
  };

  // Planning: the one guaranteed AI call. Build a grounded prompt, ask the model
  // for a plan, and guard the untrusted JSON hard. Failures map to a friendly
  // ServiceUnavailableException with the real cause logged (like DiagnosisService).
  const planning = async (
    state: CoachingState,
  ): Promise<Partial<CoachingState>> => {
    const { system, prompt } = buildPlanPrompt({
      stats: {
        currentWpm: state.stats.currentWpm,
        bestWpm: state.stats.bestWpm,
        averageWpm: state.stats.averageWpm,
        averageAccuracy: state.stats.averageAccuracy,
      },
      diagnosisPatterns: state.diagnosisPatterns,
      primaryWeaknesses: state.profile.primaryWeaknesses,
      strengths: state.profile.strengths,
      learningStyle: state.profile.learningStyle,
      previousPlan: state.previousPlan
        ? {
            summary: state.previousPlan.summary,
            goals: state.previousPlan.goals,
          }
        : null,
    });

    let raw: string;
    try {
      raw = await ai.complete({ system, prompt, json: true });
    } catch (error) {
      logger.warn(
        `AI completion failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(
        'The AI coach is unavailable right now. Please try again in a moment.',
      );
    }

    let plan: ParsedPlan;
    try {
      plan = parsePlanResponse(raw);
    } catch (error) {
      logger.warn(
        `AI plan could not be parsed: ${error instanceof Error ? error.message : String(error)}. Raw (truncated): ${raw.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'The AI returned an unexpected response. Please try again.',
      );
    }

    return { plan };
  };

  // Content generation: intentionally frugal. Drills are generated on demand by
  // the UI (the Practice button), so the cycle keeps recommendedDrills as links
  // and spends no extra AI call here. The seam stays ready if we ever choose to
  // pre-generate one drill for the top weakness.
  const contentGeneration = (): Partial<CoachingState> => ({
    generatedDrillId: null,
  });

  // Evaluation: pure math, no AI. Score the previous plan against where the user
  // is now (deltas plus which of its goals are met).
  const evaluate = (state: CoachingState): Partial<CoachingState> => {
    if (!state.previousPlan) {
      return { evaluation: null };
    }
    return {
      evaluation: evaluatePrevious(
        {
          baseline: state.previousPlan.baseline,
          goals: state.previousPlan.goals,
        },
        {
          currentWpm: state.stats.currentWpm,
          bestWpm: state.stats.bestWpm,
          averageWpm: state.stats.averageWpm,
          averageAccuracy: state.stats.averageAccuracy,
        },
      ),
    };
  };

  return new StateGraph(CoachingStateAnnotation)
    .addNode('observation', observation)
    .addNode('memory', memory)
    .addNode('diagnosis', diagnosis)
    .addNode('planning', planning)
    .addNode('contentGeneration', contentGeneration)
    .addNode('evaluate', evaluate)
    .addEdge(START, 'observation')
    .addEdge('observation', 'memory')
    .addEdge('memory', 'diagnosis')
    .addEdge('diagnosis', 'planning')
    .addEdge('planning', 'contentGeneration')
    .addEdge('contentGeneration', 'evaluate')
    .addEdge('evaluate', END)
    .compile();
}

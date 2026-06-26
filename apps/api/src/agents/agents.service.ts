import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsService } from '../analytics/analytics.service';
import { LearningProfileService } from '../learning-profile/learning-profile.service';
import { DiagnosisService } from '../learning-profile/diagnosis.service';
import { AiService } from '../ai/ai.service';
import {
  TrainingPlan,
  TrainingPlanDocument,
} from './schemas/training-plan.schema';
import { buildCoachingGraph } from './coaching-graph';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private readonly graph: ReturnType<typeof buildCoachingGraph>;

  constructor(
    @InjectModel(TrainingPlan.name)
    private readonly planModel: Model<TrainingPlanDocument>,
    private readonly analytics: AnalyticsService,
    private readonly profiles: LearningProfileService,
    private readonly diagnoses: DiagnosisService,
    private readonly ai: AiService,
  ) {
    this.graph = buildCoachingGraph({
      analytics: this.analytics,
      profiles: this.profiles,
      diagnoses: this.diagnoses,
      ai: this.ai,
      latestPlan: (userId) => this.latestPlan(userId),
      logger: this.logger,
    });
  }

  /**
   * Run one on-demand coaching cycle: observe the user's real benchmark, recall
   * long-term memory, (re)diagnose only when stale, plan the next cycle with a
   * single AI call, evaluate the previous plan, and persist the result as
   * permanent memory. Returns the newly stored plan.
   */
  async runCoachingCycle(userId: string): Promise<TrainingPlanDocument> {
    const final = await this.graph.invoke({ userId });

    if (!final.plan) {
      // Planning throws on failure, so reaching here means no plan was produced.
      throw new ServiceUnavailableException(
        'The AI coach could not produce a plan. Please try again.',
      );
    }

    return this.planModel.create({
      userId,
      summary: final.plan.summary,
      targetWeaknesses: final.plan.targetWeaknesses,
      goals: final.plan.goals,
      recommendedDrills: final.plan.recommendedDrills,
      baseline: {
        wpm: final.stats.averageWpm,
        accuracy: final.stats.averageAccuracy,
      },
      basedOnDiagnosisId: final.basedOnDiagnosisId,
      previousPlanId: final.previousPlan
        ? String(final.previousPlan._id)
        : null,
      evaluation: final.evaluation,
      aiModel: this.ai.model,
    });
  }

  /** The user's training plans, newest first (permanent history). */
  listPlans(userId: string): Promise<TrainingPlanDocument[]> {
    return this.planModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  /** The user's most recent training plan, or null if they have none yet. */
  latestPlan(userId: string): Promise<TrainingPlanDocument | null> {
    return this.planModel.findOne({ userId }).sort({ createdAt: -1 }).exec();
  }
}

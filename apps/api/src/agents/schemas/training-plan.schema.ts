import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { Difficulty, GoalMetric } from '../planning';

export type TrainingPlanDocument = HydratedDocument<TrainingPlan>;

/** One measurable goal for the next training cycle. */
@Schema({ _id: false })
export class PlanGoal {
  @Prop({ required: true, type: String, enum: ['wpm', 'accuracy'] })
  metric!: GoalMetric;

  @Prop({ required: true })
  target!: number;

  @Prop({ default: '' })
  rationale!: string;
}
export const PlanGoalSchema = SchemaFactory.createForClass(PlanGoal);

/** A drill the coach recommends for one of the plan's target weaknesses. */
@Schema({ _id: false })
export class RecommendedDrill {
  @Prop({ required: true })
  weakness!: string;

  @Prop({ required: true, type: String, enum: ['easy', 'medium', 'hard'] })
  difficulty!: Difficulty;
}
export const RecommendedDrillSchema =
  SchemaFactory.createForClass(RecommendedDrill);

/** Benchmark numbers captured when the plan was made, to score the next cycle. */
@Schema({ _id: false })
export class PlanBaseline {
  @Prop({ required: true })
  wpm!: number;

  @Prop({ required: true })
  accuracy!: number;
}
export const PlanBaselineSchema = SchemaFactory.createForClass(PlanBaseline);

/** How the user did against the previous plan. Pure math, no AI. */
@Schema({ _id: false })
export class PlanEvaluation {
  @Prop({ required: true })
  wpmDelta!: number;

  @Prop({ required: true })
  accuracyDelta!: number;

  @Prop({ type: [String], default: [] })
  metGoals!: string[];
}
export const PlanEvaluationSchema =
  SchemaFactory.createForClass(PlanEvaluation);

/** A stored AI training plan. Permanent long-term memory, never overwritten. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class TrainingPlan {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  summary!: string;

  @Prop({ type: [String], default: [] })
  targetWeaknesses!: string[];

  @Prop({ type: [PlanGoalSchema], default: [] })
  goals!: PlanGoal[];

  @Prop({ type: [RecommendedDrillSchema], default: [] })
  recommendedDrills!: RecommendedDrill[];

  @Prop({ type: PlanBaselineSchema, required: true })
  baseline!: PlanBaseline;

  @Prop({ type: String, default: null })
  basedOnDiagnosisId!: string | null;

  @Prop({ type: String, default: null })
  previousPlanId!: string | null;

  @Prop({ type: PlanEvaluationSchema, default: null })
  evaluation!: PlanEvaluation | null;

  @Prop({ required: true })
  aiModel!: string;

  createdAt!: Date;
}

export const TrainingPlanSchema = SchemaFactory.createForClass(TrainingPlan);

// Fast "latest first" history lookups per user.
TrainingPlanSchema.index({ userId: 1, createdAt: -1 });

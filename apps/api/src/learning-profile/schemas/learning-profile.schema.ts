import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LearningProfileDocument = HydratedDocument<LearningProfile>;

/** A single achievement awarded to a user (e.g. a WPM threshold or a streak). */
@Schema({ _id: false })
export class Milestone {
  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  value!: number;

  @Prop({ required: true, default: () => new Date() })
  achievedAt!: Date;
}

export const MilestoneSchema = SchemaFactory.createForClass(Milestone);

/**
 * One permanent profile per user. Numeric stats and weaknesses are derived from
 * the user's TypingSessions on every recompute. `strengths` and `learningStyle`
 * are intentionally left empty/null here, the AI fills them in Phase 3+.
 */
@Schema({ timestamps: { createdAt: false, updatedAt: true } })
export class LearningProfile {
  // `unique` already creates the index, so no separate index is declared.
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ required: true, default: 0 })
  currentWpm!: number;

  @Prop({ required: true, default: 0 })
  bestWpm!: number;

  @Prop({ required: true, default: 0 })
  averageWpm!: number;

  @Prop({ required: true, default: 0 })
  averageAccuracy!: number;

  @Prop({ required: true, default: 0 })
  totalSessions!: number;

  @Prop({ type: [String], default: [] })
  primaryWeaknesses!: string[];

  // Filled by the AI later (Phase 3+).
  @Prop({ type: [String], default: [] })
  strengths!: string[];

  @Prop({ type: [MilestoneSchema], default: [] })
  milestones!: Milestone[];

  // Filled by the AI later (Phase 3+).
  @Prop({ type: String, default: null })
  learningStyle!: string | null;

  @Prop({ required: true, default: false })
  plateauDetected!: boolean;

  updatedAt!: Date;
}

export const LearningProfileSchema =
  SchemaFactory.createForClass(LearningProfile);

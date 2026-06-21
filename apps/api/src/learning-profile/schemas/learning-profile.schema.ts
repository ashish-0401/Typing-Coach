import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type LearningProfileDocument = HydratedDocument<LearningProfile>;

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

  // Shape is defined in a later step, kept empty for now.
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  milestones!: Record<string, unknown>[];

  // Filled by the AI later (Phase 3+).
  @Prop({ type: String, default: null })
  learningStyle!: string | null;

  @Prop({ required: true, default: false })
  plateauDetected!: boolean;

  updatedAt!: Date;
}

export const LearningProfileSchema =
  SchemaFactory.createForClass(LearningProfile);

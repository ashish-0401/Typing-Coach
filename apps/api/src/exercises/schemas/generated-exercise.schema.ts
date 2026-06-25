import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { Difficulty } from '../exercise-generator';

export type GeneratedExerciseDocument = HydratedDocument<GeneratedExercise>;

/** A stored AI-generated typing drill. Permanent history, never overwritten. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class GeneratedExercise {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  weakness!: string;

  @Prop({ required: true, type: String, enum: ['easy', 'medium', 'hard'] })
  difficulty!: Difficulty;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  text!: string;

  @Prop({ type: [String], default: [] })
  targetWords!: string[];

  @Prop({ required: true })
  aiModel!: string;

  createdAt!: Date;
}

export const GeneratedExerciseSchema =
  SchemaFactory.createForClass(GeneratedExercise);

// Fast "latest first" history lookups per user.
GeneratedExerciseSchema.index({ userId: 1, createdAt: -1 });

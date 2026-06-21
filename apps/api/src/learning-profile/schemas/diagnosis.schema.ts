import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DiagnosisDocument = HydratedDocument<Diagnosis>;

/** A stored AI diagnosis. Permanent history, never overwritten. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Diagnosis {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  summary!: string;

  @Prop({ required: true })
  reasoning!: string;

  @Prop({ type: [String], default: [] })
  patterns!: string[];

  @Prop({ required: true })
  basedOnSessions!: number;

  @Prop({ required: true })
  aiModel!: string;

  createdAt!: Date;
}

export const DiagnosisSchema = SchemaFactory.createForClass(Diagnosis);

// Fast "latest first" history lookups per user.
DiagnosisSchema.index({ userId: 1, createdAt: -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TypingSessionDocument = HydratedDocument<TypingSession>;

@Schema()
export class TypingSession {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, default: () => new Date() })
  date!: Date;

  @Prop({ required: true })
  wpm!: number;

  @Prop({ required: true })
  accuracy!: number;

  @Prop({ required: true })
  backspaces!: number;

  @Prop({ type: [String], default: [] })
  mistakes!: string[];

  // Labels for the session, e.g. ["drill"] for a generated-exercise run.
  @Prop({ type: [String], default: [] })
  tags!: string[];
}

export const TypingSessionSchema = SchemaFactory.createForClass(TypingSession);

// Fast lookups of a user's sessions, newest first.
TypingSessionSchema.index({ userId: 1, date: -1 });

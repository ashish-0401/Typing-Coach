import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CoachConversationDocument = HydratedDocument<CoachConversation>;

/** One message in a coach conversation. */
@Schema({ _id: false })
export class CoachMessage {
  @Prop({ required: true, enum: ['user', 'assistant'] })
  role!: 'user' | 'assistant';

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true, default: () => new Date() })
  createdAt!: Date;
}

export const CoachMessageSchema = SchemaFactory.createForClass(CoachMessage);

/** One permanent conversation per user. Past messages are never deleted. */
@Schema({ timestamps: { createdAt: false, updatedAt: true } })
export class CoachConversation {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ type: [CoachMessageSchema], default: [] })
  messages!: CoachMessage[];

  updatedAt!: Date;
}

export const CoachConversationSchema =
  SchemaFactory.createForClass(CoachConversation);

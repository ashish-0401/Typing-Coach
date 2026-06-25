import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { LearningProfileModule } from '../learning-profile/learning-profile.module';
import {
  TypingSession,
  TypingSessionSchema,
} from '../sessions/schemas/typing-session.schema';
import {
  CoachConversation,
  CoachConversationSchema,
} from './schemas/coach-conversation.schema';
import { CoachService } from './coach.service';
import { CoachController } from './coach.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CoachConversation.name, schema: CoachConversationSchema },
      { name: TypingSession.name, schema: TypingSessionSchema },
    ]),
    AuthModule,
    AiModule,
    LearningProfileModule,
  ],
  controllers: [CoachController],
  providers: [CoachService],
})
export class CoachModule {}

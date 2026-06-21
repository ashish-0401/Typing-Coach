import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  TypingSession,
  TypingSessionSchema,
} from '../sessions/schemas/typing-session.schema';
import {
  LearningProfile,
  LearningProfileSchema,
} from './schemas/learning-profile.schema';
import { LearningProfileService } from './learning-profile.service';
import { LearningProfileController } from './learning-profile.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LearningProfile.name, schema: LearningProfileSchema },
      { name: TypingSession.name, schema: TypingSessionSchema },
    ]),
    AuthModule,
  ],
  controllers: [LearningProfileController],
  providers: [LearningProfileService],
  exports: [LearningProfileService],
})
export class LearningProfileModule {}

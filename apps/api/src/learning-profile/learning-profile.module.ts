import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import {
  TypingSession,
  TypingSessionSchema,
} from '../sessions/schemas/typing-session.schema';
import {
  LearningProfile,
  LearningProfileSchema,
} from './schemas/learning-profile.schema';
import { Diagnosis, DiagnosisSchema } from './schemas/diagnosis.schema';
import { LearningProfileService } from './learning-profile.service';
import { LearningProfileController } from './learning-profile.controller';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisController } from './diagnosis.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LearningProfile.name, schema: LearningProfileSchema },
      { name: TypingSession.name, schema: TypingSessionSchema },
      { name: Diagnosis.name, schema: DiagnosisSchema },
    ]),
    AuthModule,
    AiModule,
  ],
  controllers: [LearningProfileController, DiagnosisController],
  providers: [LearningProfileService, DiagnosisService],
  exports: [LearningProfileService],
})
export class LearningProfileModule {}

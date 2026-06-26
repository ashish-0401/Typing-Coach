import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LearningProfileModule } from '../learning-profile/learning-profile.module';
import {
  TrainingPlan,
  TrainingPlanSchema,
} from './schemas/training-plan.schema';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrainingPlan.name, schema: TrainingPlanSchema },
    ]),
    AuthModule,
    AiModule,
    AnalyticsModule,
    LearningProfileModule,
  ],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}

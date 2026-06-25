import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { LearningProfileModule } from '../learning-profile/learning-profile.module';
import {
  GeneratedExercise,
  GeneratedExerciseSchema,
} from './schemas/generated-exercise.schema';
import { ExercisesService } from './exercises.service';
import { ExercisesController } from './exercises.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneratedExercise.name, schema: GeneratedExerciseSchema },
    ]),
    AuthModule,
    AiModule,
    LearningProfileModule,
  ],
  controllers: [ExercisesController],
  providers: [ExercisesService],
})
export class ExercisesModule {}

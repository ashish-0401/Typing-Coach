import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { GenerateExerciseDto } from './dto/generate-exercise.dto';
import { GeneratedExerciseDocument } from './schemas/generated-exercise.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  generate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateExerciseDto,
  ): Promise<GeneratedExerciseDocument> {
    return this.exercisesService.generate(user.sub, {
      weakness: dto.weakness,
      difficulty: dto.difficulty,
    });
  }

  @Get()
  list(@CurrentUser() user: JwtPayload): Promise<GeneratedExerciseDocument[]> {
    return this.exercisesService.list(user.sub);
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<GeneratedExerciseDocument> {
    const exercise = await this.exercisesService.getById(user.sub, id);
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }
    return exercise;
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.exercisesService.remove(user.sub, id);
  }
}

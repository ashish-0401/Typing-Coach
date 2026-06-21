import { Controller, Get, UseGuards } from '@nestjs/common';
import { LearningProfileService } from './learning-profile.service';
import { LearningProfileDocument } from './schemas/learning-profile.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('learning-profile')
@UseGuards(JwtAuthGuard)
export class LearningProfileController {
  constructor(
    private readonly learningProfileService: LearningProfileService,
  ) {}

  @Get()
  get(@CurrentUser() user: JwtPayload): Promise<LearningProfileDocument> {
    return this.learningProfileService.getByUser(user.sub);
  }
}

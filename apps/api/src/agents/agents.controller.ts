import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { TrainingPlanDocument } from './schemas/training-plan.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  /** Run the coaching cycle on demand and return the newly stored plan. */
  @Post('coaching-cycle')
  run(@CurrentUser() user: JwtPayload): Promise<TrainingPlanDocument> {
    return this.agents.runCoachingCycle(user.sub);
  }

  /** The user's training plans, newest first. */
  @Get('plans')
  list(@CurrentUser() user: JwtPayload): Promise<TrainingPlanDocument[]> {
    return this.agents.listPlans(user.sub);
  }

  /** The user's current (most recent) plan, or null if they have none yet. */
  @Get('plans/latest')
  latest(
    @CurrentUser() user: JwtPayload,
  ): Promise<TrainingPlanDocument | null> {
    return this.agents.latestPlan(user.sub);
  }
}

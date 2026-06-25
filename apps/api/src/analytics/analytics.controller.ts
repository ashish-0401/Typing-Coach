import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService, AnalyticsSummary } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: JwtPayload,
    @Query('includeDrills') includeDrills?: string,
  ): Promise<AnalyticsSummary> {
    return this.analyticsService.summary(user.sub, includeDrills === 'true');
  }
}

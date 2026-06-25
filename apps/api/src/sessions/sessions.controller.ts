import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  SessionsService,
  CreateSessionResult,
  PaginatedSessions,
} from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSessionDto,
  ): Promise<CreateSessionResult> {
    return this.sessionsService.create(user.sub, dto);
  }

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tag') tag?: string,
  ): Promise<PaginatedSessions> {
    return this.sessionsService.findPage(user.sub, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      tag: tag || undefined,
    });
  }
}

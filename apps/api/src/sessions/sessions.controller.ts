import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { TypingSessionDocument } from './schemas/typing-session.schema';
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
  ): Promise<TypingSessionDocument> {
    return this.sessionsService.create(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload): Promise<TypingSessionDocument[]> {
    return this.sessionsService.findByUser(user.sub);
  }
}

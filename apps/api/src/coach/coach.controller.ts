import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CoachService } from './coach.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CoachMessage } from './schemas/coach-conversation.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('coach')
@UseGuards(JwtAuthGuard)
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get('messages')
  history(@CurrentUser() user: JwtPayload): Promise<CoachMessage[]> {
    return this.coachService.getConversation(user.sub);
  }

  @Post('messages')
  send(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendMessageDto,
  ): Promise<CoachMessage> {
    return this.coachService.sendMessage(user.sub, dto.text);
  }
}

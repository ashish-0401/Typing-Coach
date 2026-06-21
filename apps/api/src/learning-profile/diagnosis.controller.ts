import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisDocument } from './schemas/diagnosis.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('diagnoses')
@UseGuards(JwtAuthGuard)
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post()
  run(@CurrentUser() user: JwtPayload): Promise<DiagnosisDocument> {
    return this.diagnosisService.diagnose(user.sub);
  }

  @Get('latest')
  latest(@CurrentUser() user: JwtPayload): Promise<DiagnosisDocument | null> {
    return this.diagnosisService.getLatest(user.sub);
  }

  @Get()
  history(@CurrentUser() user: JwtPayload): Promise<DiagnosisDocument[]> {
    return this.diagnosisService.getHistory(user.sub);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TypingSession,
  TypingSessionDocument,
} from './schemas/typing-session.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { LearningProfileService } from '../learning-profile/learning-profile.service';
import type { DetectedMilestone } from '../learning-profile/milestone-detection';

export interface CreateSessionResult {
  session: TypingSessionDocument;
  newMilestones: DetectedMilestone[];
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(TypingSession.name)
    private readonly sessionModel: Model<TypingSessionDocument>,
    private readonly learningProfileService: LearningProfileService,
  ) {}

  async create(
    userId: string,
    dto: CreateSessionDto,
  ): Promise<CreateSessionResult> {
    const session = await this.sessionModel.create({ userId, ...dto });
    // Saving a session refreshes the profile and may earn new milestones.
    const { newMilestones } =
      await this.learningProfileService.recompute(userId);
    return { session, newMilestones };
  }

  findByUser(userId: string): Promise<TypingSessionDocument[]> {
    return this.sessionModel.find({ userId }).sort({ date: -1 }).exec();
  }
}

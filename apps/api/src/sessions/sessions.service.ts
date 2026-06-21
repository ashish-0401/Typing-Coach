import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TypingSession,
  TypingSessionDocument,
} from './schemas/typing-session.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { LearningProfileService } from '../learning-profile/learning-profile.service';

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
  ): Promise<TypingSessionDocument> {
    const session = await this.sessionModel.create({ userId, ...dto });
    // Saving a session refreshes the user's permanent learning profile.
    await this.learningProfileService.recompute(userId);
    return session;
  }

  findByUser(userId: string): Promise<TypingSessionDocument[]> {
    return this.sessionModel.find({ userId }).sort({ date: -1 }).exec();
  }
}

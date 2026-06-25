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

export interface PaginatedSessions {
  items: TypingSessionDocument[];
  total: number;
  tags: string[];
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

  /**
   * A page of the user's sessions (newest first), optionally filtered to a tag,
   * plus the total count and the distinct tags across all their sessions (for
   * the filter UI).
   */
  async findPage(
    userId: string,
    options: { page: number; limit: number; tag?: string },
  ): Promise<PaginatedSessions> {
    const page = Math.max(1, options.page);
    const limit = Math.min(100, Math.max(1, options.limit));
    const filter: Record<string, unknown> = { userId };
    if (options.tag) {
      filter.tags = options.tag;
    }

    const [items, total, tags] = await Promise.all([
      this.sessionModel
        .find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.sessionModel.countDocuments(filter).exec(),
      this.sessionModel.distinct('tags', { userId }).exec(),
    ]);

    return { items, total, tags: tags.filter(Boolean) };
  }
}

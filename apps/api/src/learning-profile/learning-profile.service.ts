import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TypingSession,
  TypingSessionDocument,
} from '../sessions/schemas/typing-session.schema';
import {
  LearningProfile,
  LearningProfileDocument,
} from './schemas/learning-profile.schema';
import { computeProfileMetrics } from './profile-metrics';

@Injectable()
export class LearningProfileService {
  constructor(
    @InjectModel(LearningProfile.name)
    private readonly profileModel: Model<LearningProfileDocument>,
    @InjectModel(TypingSession.name)
    private readonly sessionModel: Model<TypingSessionDocument>,
  ) {}

  /**
   * Recompute the user's profile from their typing sessions and upsert it.
   * Only derived fields are written, so AI-owned fields (strengths,
   * learningStyle, milestones) survive untouched once they exist (Phase 3+).
   */
  async recompute(userId: string): Promise<LearningProfileDocument> {
    // Newest-first, matching the ordering computeProfileMetrics expects.
    const sessions = await this.sessionModel
      .find({ userId })
      .sort({ date: -1 })
      .exec();

    const metrics = computeProfileMetrics(
      sessions.map((session) => ({
        wpm: session.wpm,
        accuracy: session.accuracy,
        mistakes: session.mistakes,
      })),
    );

    const profile = await this.profileModel
      .findOneAndUpdate(
        { userId },
        { $set: { userId, ...metrics } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    // upsert + new guarantees a document; guard satisfies the nullable type.
    if (!profile) {
      throw new InternalServerErrorException(
        'Failed to upsert learning profile',
      );
    }

    return profile;
  }

  /** Return the user's profile, building it on demand if it does not exist yet. */
  async getByUser(userId: string): Promise<LearningProfileDocument> {
    const existing = await this.profileModel.findOne({ userId }).exec();
    return existing ?? this.recompute(userId);
  }
}

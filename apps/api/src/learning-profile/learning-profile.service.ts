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
import {
  detectNewMilestones,
  type DetectedMilestone,
} from './milestone-detection';

export interface RecomputeResult {
  profile: LearningProfileDocument;
  newMilestones: DetectedMilestone[];
}

@Injectable()
export class LearningProfileService {
  constructor(
    @InjectModel(LearningProfile.name)
    private readonly profileModel: Model<LearningProfileDocument>,
    @InjectModel(TypingSession.name)
    private readonly sessionModel: Model<TypingSessionDocument>,
  ) {}

  /**
   * Recompute the user's profile from their typing sessions, detect any newly
   * earned milestones, and upsert it. AI-owned fields (strengths, learningStyle)
   * are left untouched so Phase 3+ can fill them. Returns the profile plus the
   * milestones earned by the latest session (for surfacing on session save).
   */
  async recompute(userId: string): Promise<RecomputeResult> {
    // Exclude drills: the permanent profile is a benchmark of real tests, not
    // practice on hard generated passages.
    const sessions = await this.sessionModel
      .find({ userId, tags: { $ne: 'drill' } })
      .sort({ date: -1 })
      .exec();

    const metrics = computeProfileMetrics(
      sessions.map((session) => ({
        wpm: session.wpm,
        accuracy: session.accuracy,
        mistakes: session.mistakes,
      })),
    );

    // The existing profile gives us the prior best and already-earned milestones.
    const existing = await this.profileModel.findOne({ userId }).exec();
    const existingMilestones = existing?.milestones ?? [];
    const bestAccuracy = sessions.reduce(
      (max, session) => Math.max(max, session.accuracy),
      0,
    );

    const newMilestones = detectNewMilestones({
      bestWpm: metrics.bestWpm,
      previousBestWpm: existing?.bestWpm ?? 0,
      bestAccuracy,
      totalSessions: metrics.totalSessions,
      existingMilestones,
    });

    // Prepend freshly earned milestones so the list stays newest-first.
    const milestones = [...newMilestones, ...existingMilestones].map(
      (milestone) => ({
        type: milestone.type,
        value: milestone.value,
        achievedAt: milestone.achievedAt,
      }),
    );

    const profile = await this.profileModel
      .findOneAndUpdate(
        { userId },
        { $set: { userId, ...metrics, milestones } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    // upsert + new guarantees a document; guard satisfies the nullable type.
    if (!profile) {
      throw new InternalServerErrorException(
        'Failed to upsert learning profile',
      );
    }

    return { profile, newMilestones };
  }

  /** Return the user's profile, building it on demand if it does not exist yet. */
  async getByUser(userId: string): Promise<LearningProfileDocument> {
    const existing = await this.profileModel.findOne({ userId }).exec();
    if (existing) {
      return existing;
    }
    const { profile } = await this.recompute(userId);
    return profile;
  }

  /**
   * Write the AI-owned seams (strengths, learningStyle) onto the profile without
   * touching the derived stats or milestones. Called after an AI diagnosis.
   */
  async applyAiInsights(
    userId: string,
    insights: { strengths: string[]; learningStyle: string | null },
  ): Promise<void> {
    await this.profileModel
      .updateOne(
        { userId },
        {
          $set: {
            strengths: insights.strengths,
            learningStyle: insights.learningStyle,
          },
        },
      )
      .exec();
  }
}

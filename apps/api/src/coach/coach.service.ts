import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiService } from '../ai/ai.service';
import {
  TypingSession,
  TypingSessionDocument,
} from '../sessions/schemas/typing-session.schema';
import { LearningProfileService } from '../learning-profile/learning-profile.service';
import { DiagnosisService } from '../learning-profile/diagnosis.service';
import {
  CoachConversation,
  CoachConversationDocument,
  CoachMessage,
} from './schemas/coach-conversation.schema';
import { buildCoachSystemPrompt, capHistory } from './coach-prompt';

// How many recent turns to send to the model (history is stored in full).
const HISTORY_WINDOW = 12;
// How many recent sessions to summarize for the WPM trend.
const RECENT_SESSIONS = 10;
// How many milestones to mention in the prompt.
const MILESTONES_IN_PROMPT = 5;

function describeMilestone(milestone: { type: string; value: number }): string {
  switch (milestone.type) {
    case 'best_wpm':
      return `${milestone.value} WPM personal best`;
    case 'wpm_threshold':
      return `reached ${milestone.value} WPM`;
    case 'accuracy':
      return `${milestone.value}% accuracy`;
    case 'session_count':
      return milestone.value === 1
        ? 'first session'
        : `${milestone.value} sessions`;
    default:
      return String(milestone.value);
  }
}

@Injectable()
export class CoachService {
  private readonly logger = new Logger(CoachService.name);

  constructor(
    @InjectModel(CoachConversation.name)
    private readonly conversationModel: Model<CoachConversationDocument>,
    @InjectModel(TypingSession.name)
    private readonly sessionModel: Model<TypingSessionDocument>,
    private readonly profiles: LearningProfileService,
    private readonly diagnoses: DiagnosisService,
    private readonly ai: AiService,
  ) {}

  /** Return the user's full conversation, oldest message first. */
  async getConversation(userId: string): Promise<CoachMessage[]> {
    const conversation = await this.conversationModel
      .findOne({ userId })
      .exec();
    return conversation?.messages ?? [];
  }

  /**
   * Append the user's message, ask the coach (grounded in the user's data plus a
   * capped window of recent turns), store both turns permanently, and return the
   * assistant reply.
   */
  async sendMessage(userId: string, text: string): Promise<CoachMessage> {
    const content = text.trim();
    if (content.length === 0) {
      throw new BadRequestException('Message cannot be empty.');
    }

    const existing = await this.conversationModel.findOne({ userId }).exec();
    const history = existing?.messages ?? [];

    const system = await this.buildSystemPrompt(userId);
    const window = capHistory(history, HISTORY_WINDOW).map((message) => ({
      role: message.role,
      content: message.content,
    }));
    window.push({ role: 'user', content });

    let reply: string;
    try {
      reply = await this.ai.chat({ system, messages: window });
    } catch (error) {
      this.logger.warn(
        `Coach chat failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(
        'The coach is unavailable right now. Please try again in a moment.',
      );
    }

    const userMessage: CoachMessage = {
      role: 'user',
      content,
      createdAt: new Date(),
    };
    const assistantMessage: CoachMessage = {
      role: 'assistant',
      content: reply,
      createdAt: new Date(),
    };

    // Append both turns; userId is set from the filter on insert.
    await this.conversationModel
      .updateOne(
        { userId },
        { $push: { messages: { $each: [userMessage, assistantMessage] } } },
        { upsert: true },
      )
      .exec();

    return assistantMessage;
  }

  /** Build the coach's system prompt from the user's real profile, diagnosis and recent sessions. */
  private async buildSystemPrompt(userId: string): Promise<string> {
    const [profile, diagnosis, sessions] = await Promise.all([
      this.profiles.getByUser(userId),
      this.diagnoses.getLatest(userId),
      this.sessionModel
        .find({ userId })
        .sort({ date: -1 })
        .limit(RECENT_SESSIONS)
        .exec(),
    ]);

    const recentWpm = [...sessions].reverse().map((session) => session.wpm);

    return buildCoachSystemPrompt({
      currentWpm: profile.currentWpm,
      averageWpm: profile.averageWpm,
      bestWpm: profile.bestWpm,
      averageAccuracy: profile.averageAccuracy,
      totalSessions: profile.totalSessions,
      plateauDetected: profile.plateauDetected,
      weaknesses: profile.primaryWeaknesses,
      strengths: profile.strengths,
      learningStyle: profile.learningStyle,
      milestones: profile.milestones
        .slice(0, MILESTONES_IN_PROMPT)
        .map((milestone) => describeMilestone(milestone)),
      diagnosisSummary: diagnosis?.summary ?? null,
      diagnosisReasoning: diagnosis?.reasoning ?? null,
      diagnosisPatterns: diagnosis?.patterns ?? [],
      recentWpm,
    });
  }
}

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
import { Diagnosis, DiagnosisDocument } from './schemas/diagnosis.schema';
import { LearningProfileService } from './learning-profile.service';
import {
  buildDiagnosisPrompt,
  parseDiagnosisResponse,
  type DiagnosisContext,
  type ParsedDiagnosis,
} from './diagnosis';

const MIN_SESSIONS_FOR_DIAGNOSIS = 3;
const RECENT_SESSION_LIMIT = 20;

@Injectable()
export class DiagnosisService {
  private readonly logger = new Logger(DiagnosisService.name);

  constructor(
    @InjectModel(Diagnosis.name)
    private readonly diagnosisModel: Model<DiagnosisDocument>,
    @InjectModel(TypingSession.name)
    private readonly sessionModel: Model<TypingSessionDocument>,
    private readonly profiles: LearningProfileService,
    private readonly ai: AiService,
  ) {}

  /**
   * Run a fresh AI diagnosis for the user: gather their data, ask the AI for a
   * structured analysis, store it permanently, and fill the profile's AI seams
   * (strengths, learningStyle). On-demand only.
   */
  async diagnose(userId: string): Promise<DiagnosisDocument> {
    const profile = await this.profiles.getByUser(userId);
    if (profile.totalSessions < MIN_SESSIONS_FOR_DIAGNOSIS) {
      throw new BadRequestException(
        `Finish at least ${MIN_SESSIONS_FOR_DIAGNOSIS} typing tests so I have enough to analyze.`,
      );
    }

    const sessions = await this.sessionModel
      .find({ userId })
      .sort({ date: -1 })
      .limit(RECENT_SESSION_LIMIT)
      .exec();

    // Sessions come newest-first; reverse for an old -> new trend.
    const chronological = [...sessions].reverse();
    const context: DiagnosisContext = {
      currentWpm: profile.currentWpm,
      bestWpm: profile.bestWpm,
      averageWpm: profile.averageWpm,
      averageAccuracy: profile.averageAccuracy,
      totalSessions: profile.totalSessions,
      plateauDetected: profile.plateauDetected,
      topMistakes: profile.primaryWeaknesses,
      recentWpm: chronological.map((session) => session.wpm),
      recentAccuracy: chronological.map((session) => session.accuracy),
    };

    const { system, prompt } = buildDiagnosisPrompt(context);

    let raw: string;
    try {
      raw = await this.ai.complete({ system, prompt, json: true });
    } catch (error) {
      this.logger.warn(
        `AI completion failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(
        'The AI coach is unavailable right now. Please try again in a moment.',
      );
    }

    let parsed: ParsedDiagnosis;
    try {
      parsed = parseDiagnosisResponse(raw);
    } catch (error) {
      this.logger.warn(
        `AI response could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(
        'The AI returned an unexpected response. Please try again.',
      );
    }

    // Fill the profile seams (AI-owned fields) without touching derived stats.
    await this.profiles.applyAiInsights(userId, {
      strengths: parsed.strengths,
      learningStyle:
        parsed.learningStyle.length > 0 ? parsed.learningStyle : null,
    });

    return this.diagnosisModel.create({
      userId,
      summary: parsed.summary,
      reasoning: parsed.reasoning,
      patterns: parsed.patterns,
      basedOnSessions: profile.totalSessions,
      aiModel: this.ai.model,
    });
  }

  getLatest(userId: string): Promise<DiagnosisDocument | null> {
    return this.diagnosisModel
      .findOne({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  getHistory(userId: string): Promise<DiagnosisDocument[]> {
    return this.diagnosisModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}

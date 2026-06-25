import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { AiService } from '../ai/ai.service';
import { LearningProfileService } from '../learning-profile/learning-profile.service';
import { DiagnosisService } from '../learning-profile/diagnosis.service';
import {
  GeneratedExercise,
  GeneratedExerciseDocument,
} from './schemas/generated-exercise.schema';
import {
  buildExercisePrompt,
  parseExerciseResponse,
  type Difficulty,
  type ExerciseContext,
  type ParsedExercise,
} from './exercise-generator';

export interface GenerateExerciseInput {
  weakness?: string;
  difficulty?: Difficulty;
}

const DEFAULT_DIFFICULTY: Difficulty = 'medium';
// How many diagnosis patterns to pass as extra context for the passage.
const MAX_PATTERNS = 5;
// Generous completion budget so the JSON passage always finishes (otherwise
// Groq's json mode can truncate a long passage and return json_validate_failed).
const MAX_OUTPUT_TOKENS = 1024;

@Injectable()
export class ExercisesService {
  private readonly logger = new Logger(ExercisesService.name);

  constructor(
    @InjectModel(GeneratedExercise.name)
    private readonly exerciseModel: Model<GeneratedExerciseDocument>,
    private readonly profiles: LearningProfileService,
    private readonly diagnoses: DiagnosisService,
    private readonly ai: AiService,
  ) {}

  /**
   * Generate a fresh drill targeting one of the user's real weaknesses: gather
   * their profile and latest diagnosis, ask the AI for a passage, guard it, store
   * it permanently, and return it. On-demand only, one AI call per generate.
   */
  async generate(
    userId: string,
    input: GenerateExerciseInput = {},
  ): Promise<GeneratedExerciseDocument> {
    const profile = await this.profiles.getByUser(userId);

    // Stay grounded in real data: train a weakness the user actually has.
    const weakness =
      input.weakness?.trim() || profile.primaryWeaknesses[0] || '';
    if (!weakness) {
      throw new BadRequestException(
        'Finish a few typing tests or run a diagnosis first so I know what to train.',
      );
    }

    const difficulty = input.difficulty ?? DEFAULT_DIFFICULTY;
    const diagnosis = await this.diagnoses.getLatest(userId);

    const context: ExerciseContext = {
      weakness,
      difficulty,
      strengths: profile.strengths,
      learningStyle: profile.learningStyle,
      relatedPatterns: (diagnosis?.patterns ?? []).slice(0, MAX_PATTERNS),
    };

    const { system, prompt } = buildExercisePrompt(context);

    let raw: string;
    try {
      raw = await this.ai.complete({
        system,
        prompt,
        json: true,
        maxTokens: MAX_OUTPUT_TOKENS,
      });
    } catch (error) {
      this.logger.warn(
        `AI completion failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(
        'The exercise generator is unavailable right now. Please try again in a moment.',
      );
    }

    let parsed: ParsedExercise;
    try {
      parsed = parseExerciseResponse(raw);
    } catch (error) {
      this.logger.warn(
        `AI response could not be parsed: ${error instanceof Error ? error.message : String(error)}. Raw (truncated): ${raw.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'The AI returned an unexpected response. Please try again.',
      );
    }

    return this.exerciseModel.create({
      userId,
      weakness,
      difficulty,
      title: parsed.title,
      text: parsed.text,
      targetWords: parsed.targetWords,
      aiModel: this.ai.model,
    });
  }

  /** Stored exercises for the user, newest first. */
  list(userId: string): Promise<GeneratedExerciseDocument[]> {
    return this.exerciseModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  /** A single exercise scoped to the user, or null if it is missing or not theirs. */
  getById(
    userId: string,
    id: string,
  ): Promise<GeneratedExerciseDocument | null> {
    if (!isValidObjectId(id)) {
      return Promise.resolve(null);
    }
    return this.exerciseModel.findOne({ _id: id, userId }).exec();
  }

  /** Permanently delete one of the user's drills. */
  async remove(userId: string, id: string): Promise<void> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Exercise not found');
    }
    const result = await this.exerciseModel
      .deleteOne({ _id: id, userId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Exercise not found');
    }
  }
}

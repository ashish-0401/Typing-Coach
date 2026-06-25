import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { Difficulty } from '../exercise-generator';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export class GenerateExerciseDto {
  /** Which weakness to train. Omit to default to the user's top weakness. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  weakness?: string;

  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;
}

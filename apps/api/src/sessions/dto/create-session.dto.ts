import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSessionDto {
  @IsNumber()
  @Min(0)
  wpm!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy!: number;

  @IsInt()
  @Min(0)
  backspaces!: number;

  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  mistakes!: string[];

  /** Optional labels for the session, e.g. ["drill"]. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  @Type(() => String)
  tags?: string[];
}

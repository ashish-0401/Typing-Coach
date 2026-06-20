import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsString, Max, Min } from 'class-validator';

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
}

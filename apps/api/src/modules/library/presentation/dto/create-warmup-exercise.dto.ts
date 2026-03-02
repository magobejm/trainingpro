import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const MOBILITY_TYPES = ['completo', 'parcial', 'minimo', 'undefined'] as const;

export class CreateWarmupExerciseDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(MOBILITY_TYPES)
  mobilityType?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  youtubeUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  mediaType?: string;
}

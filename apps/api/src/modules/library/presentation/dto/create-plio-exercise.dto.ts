import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const PLIO_TYPES = ['explosivo', 'relajado', 'undefined'] as const;

export class CreatePlioExerciseDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  equipment?: string;

  @IsOptional()
  @IsString()
  @IsIn(PLIO_TYPES)
  plioType?: string;

  @IsOptional()
  @IsString()
  notes?: string;

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

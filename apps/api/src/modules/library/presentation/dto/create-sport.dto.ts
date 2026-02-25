import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSportDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  @IsNotEmpty()
  @IsString()
  icon!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mediaUrl?: string;
}

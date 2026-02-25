import { PartialType } from '@nestjs/mapped-types';
import { CreateWarmupExerciseDto } from './create-warmup-exercise.dto';

export class UpdateWarmupExerciseDto extends PartialType(CreateWarmupExerciseDto) {}

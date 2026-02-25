import { PartialType } from '@nestjs/mapped-types';
import { CreatePlioExerciseDto } from './create-plio-exercise.dto';

export class UpdatePlioExerciseDto extends PartialType(CreatePlioExerciseDto) {}

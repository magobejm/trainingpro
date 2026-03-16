import { PartialType } from '@nestjs/mapped-types';
import { CreateIsometricExerciseDto } from './create-isometric-exercise.dto';

export class UpdateIsometricExerciseDto extends PartialType(CreateIsometricExerciseDto) {}

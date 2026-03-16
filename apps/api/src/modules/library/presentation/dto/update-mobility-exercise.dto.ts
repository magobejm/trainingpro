import { PartialType } from '@nestjs/mapped-types';
import { CreateMobilityExerciseDto } from './create-mobility-exercise.dto';

export class UpdateMobilityExerciseDto extends PartialType(CreateMobilityExerciseDto) {}

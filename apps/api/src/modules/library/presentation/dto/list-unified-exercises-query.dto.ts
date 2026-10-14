import { z } from 'zod';
import { pageFieldsSchema } from '../../../../common/pagination/page-query';

const text = z.string().trim().max(500).optional();

export class ListUnifiedExercisesQueryDto {
  static schema = z.object({
    baseCategory: text,
    cardioTypeIds: text,
    cursor: pageFieldsSchema.cursor,
    equipmentIds: text,
    isometricTypeIds: text,
    limit: pageFieldsSchema.limit,
    mobilityTypeIds: text,
    muscleGroupIds: text,
    plioTypeIds: text,
    search: z.string().trim().max(120).optional(),
    sportTypeIds: text,
  });

  baseCategory?: string;
  cardioTypeIds?: string;
  cursor?: string;
  equipmentIds?: string;
  isometricTypeIds?: string;
  limit?: number;
  mobilityTypeIds?: string;
  muscleGroupIds?: string;
  plioTypeIds?: string;
  search?: string;
  sportTypeIds?: string;
}

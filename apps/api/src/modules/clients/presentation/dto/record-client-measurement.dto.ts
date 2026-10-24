import { z } from 'zod';

const metric = (min: number, max: number) => z.number().min(min).max(max).nullable().optional();

export class RecordClientMeasurementDto {
  static schema = z
    .object({
      heightCm: metric(80, 260),
      hipCm: metric(40, 220),
      waistCm: metric(40, 220),
      weightKg: metric(20, 400),
    })
    .strict()
    .refine(hasNumericMeasure, { message: 'At least one measurement is required' });

  heightCm?: number | null;
  hipCm?: number | null;
  waistCm?: number | null;
  weightKg?: number | null;
}

function hasNumericMeasure(value: {
  heightCm?: number | null;
  hipCm?: number | null;
  waistCm?: number | null;
  weightKg?: number | null;
}): boolean {
  return [value.heightCm, value.hipCm, value.waistCm, value.weightKg].some((item) => typeof item === 'number');
}

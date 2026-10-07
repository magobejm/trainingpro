import { z } from 'zod';

function isHalfStep(value: number): boolean {
  return Math.abs(value * 2 - Math.round(value * 2)) < 1e-9;
}

export const rpeHalfSchema = z
  .number()
  .min(1)
  .max(10)
  .refine(isHalfStep, { message: 'RPE must use 0.5 increments' })
  .nullable()
  .optional();

export const rirIntSchema = z.number().int().min(0).max(10).nullable().optional();

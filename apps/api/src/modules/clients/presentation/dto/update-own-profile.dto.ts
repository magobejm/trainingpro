import { z } from 'zod';

const name = z.string().trim().min(1).max(80);
const phone = z
  .string()
  .trim()
  .max(30)
  .nullable()
  .optional()
  .transform((value) => (value === '' ? null : value));
const note = z
  .string()
  .trim()
  .max(2000)
  .nullable()
  .optional()
  .transform((value) => (value === '' ? null : value));

export class UpdateOwnProfileDto {
  static schema = z
    .object({
      allergies: note,
      considerations: note,
      firstName: name.optional(),
      injuries: note,
      lastName: name.optional(),
      phone,
    })
    .strict()
    .refine(hasProfileField, { message: 'At least one field is required' });

  allergies?: string | null;
  considerations?: string | null;
  firstName?: string;
  injuries?: string | null;
  lastName?: string;
  phone?: string | null;
}

function hasProfileField(value: {
  allergies?: string | null;
  considerations?: string | null;
  firstName?: string;
  injuries?: string | null;
  lastName?: string;
  phone?: string | null;
}): boolean {
  return (
    value.allergies !== undefined ||
    value.considerations !== undefined ||
    value.firstName !== undefined ||
    value.injuries !== undefined ||
    value.lastName !== undefined ||
    value.phone !== undefined
  );
}

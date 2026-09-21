import { z } from 'zod';

export class CreateCheckpointDto {
  static schema = z.object({
    content: z.unknown().optional(),
    endDate: z.string().datetime().nullable().optional(),
    note: z.string().max(2000).nullable().optional(),
    planName: z.string().trim().max(120).nullable().optional(),
    setupData: z.unknown().optional(),
    startDate: z.string().datetime().nullable().optional(),
  });

  content?: unknown;
  endDate?: null | string;
  note?: null | string;
  planName?: null | string;
  setupData?: unknown;
  startDate?: null | string;
}

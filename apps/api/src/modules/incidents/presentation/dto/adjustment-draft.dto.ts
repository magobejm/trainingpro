import { z } from 'zod';

export class AdjustmentDraftDto {
  static schema = z.object({
    draft: z.string().min(2).max(1200),
  });

  draft!: string;
}

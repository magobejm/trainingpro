import { z } from 'zod';

export class CreatePlanDto {
  static schema = z.object({
    content: z.unknown().optional(),
    description: z.string().max(2000).nullable().optional(),
    name: z.string().trim().min(1).max(120),
    setupData: z.unknown().optional(),
    strategy: z.string().max(40).nullable().optional(),
    type: z.enum(['LIBRE', 'ESTRUCTURADO']),
  });

  content?: unknown;
  description?: null | string;
  name!: string;
  setupData?: unknown;
  strategy?: null | string;
  type!: 'ESTRUCTURADO' | 'LIBRE';
}

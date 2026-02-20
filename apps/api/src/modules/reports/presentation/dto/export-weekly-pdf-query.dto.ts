import { z } from 'zod';

export class ExportWeeklyPdfQueryDto {
  static schema = z.object({
    clientId: z.string().uuid(),
    from: z.string().date(),
    to: z.string().date(),
  });

  clientId!: string;
  from!: string;
  to!: string;
}

import { z } from 'zod';

export class EnsureSessionDto {
  static schema = z.object({
    clientId: z.string().uuid(),
    sessionDate: z.string().date(),
    templateId: z.string().uuid(),
  });

  clientId!: string;
  sessionDate!: string;
  templateId!: string;
}

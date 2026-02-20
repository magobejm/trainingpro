import { z } from 'zod';

export class RespondIncidentDto {
  static schema = z.object({
    response: z.string().min(2).max(1200),
  });

  response!: string;
}

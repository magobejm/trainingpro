import { z } from 'zod';

export class IncidentIdParamDto {
  static schema = z.object({
    incidentId: z.string().uuid(),
  });

  incidentId!: string;
}

import { z } from 'zod';

const severity = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export class CreateIncidentDto {
  static schema = z.object({
    description: z.string().min(5).max(1200),
    sessionId: z.string().uuid().nullable().optional(),
    sessionItemId: z.string().uuid().nullable().optional(),
    severity,
  });

  description!: string;
  sessionId?: null | string;
  sessionItemId?: null | string;
  severity!: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';
}

import { z } from 'zod';

const severity = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const category = z.enum(['EXERCISE', 'OTHER']);

export class CreateIncidentDto {
  static schema = z.object({
    category,
    description: z.string().min(5).max(1200),
    sessionId: z.string().uuid().nullable().optional(),
    sessionItemId: z.string().uuid().nullable().optional(),
    severity,
    tag: z.string().max(60).nullable().optional(),
  });

  category!: 'EXERCISE' | 'OTHER';
  description!: string;
  sessionId?: null | string;
  sessionItemId?: null | string;
  severity!: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';
  tag?: null | string;
}

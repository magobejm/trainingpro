import { z } from 'zod';

export class UpsertWeeklyReportDto {
  static schema = z.object({
    adherencePercent: z.number().min(0).max(100).nullable().optional(),
    energy: z.number().min(1).max(10).nullable().optional(),
    mood: z.number().min(1).max(10).nullable().optional(),
    notes: z.string().max(1200).nullable().optional(),
    reportDate: z.string().date(),
    sleepHours: z.number().min(0).max(24).nullable().optional(),
    sourceSessionId: z.string().uuid().nullable().optional(),
  });

  adherencePercent?: null | number;
  energy?: null | number;
  mood?: null | number;
  notes?: null | string;
  reportDate!: string;
  sleepHours?: null | number;
  sourceSessionId?: null | string;
}

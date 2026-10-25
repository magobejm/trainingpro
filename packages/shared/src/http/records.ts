import { z } from 'zod';

export const progressRecordSchema = z
  .object({
    e1rm: z.number(),
    exerciseId: z.string(),
    exerciseName: z.string(),
    previousBest: z.number().nullable(),
    sessionDate: z.string(),
    sessionId: z.string().optional(),
  })
  .strict();

export const progressRecordsResponseSchema = z
  .object({
    records: z.array(progressRecordSchema),
  })
  .strict();

export type ProgressRecord = z.infer<typeof progressRecordSchema>;
export type ProgressRecordsResponse = z.infer<typeof progressRecordsResponseSchema>;

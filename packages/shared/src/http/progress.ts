import { z } from 'zod';

const count = z.number().int().nonnegative();
export const workoutAdherenceSchema = z
  .object({
    from: z.string().date(),
    to: z.string().date(),
    cutoffDate: z.string().date(),
    percent: z.number().min(0).max(100).nullable(),
    plannedCount: count,
    counts: z.object({ done: count, incomplete: count, skipped: count, pending: count, in_progress: count }),
    unplannedSessionsCount: count,
  })
  .strict();

export const metricCoverageSchema = z.record(
  z.string(),
  z.object({
    validSamples: count,
    eligibleSamples: count,
    unit: z.enum(['sets', 'intervals', 'sessions']),
    weightSeconds: z.number().nonnegative().optional(),
  }),
);
export type WorkoutAdherenceSummary = z.infer<typeof workoutAdherenceSchema>;
export type MetricCoverage = z.infer<typeof metricCoverageSchema>;

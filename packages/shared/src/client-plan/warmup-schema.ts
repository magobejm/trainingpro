import { z } from 'zod';

const metric = z.number().nullable().optional();
const set = z.object({
  setIndex: z.number(),
  advancedTechnique: z.string().nullable(),
  note: z.string().nullable(),
  reps: metric,
  weightKg: metric,
  restSeconds: metric,
  rir: metric,
  rpe: metric,
  distanceMeters: metric,
  durationSeconds: metric,
  heartRate: metric,
  fcMaxPct: metric,
  fcReservePct: metric,
  rom: z.string().nullable().optional(),
});
export const clientRoutineWarmupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  exercises: z.array(
    z.object({
      id: z.string(),
      displayName: z.string(),
      type: z.enum(['strength', 'cardio', 'plio', 'mobility', 'isometric', 'sport']),
      sortOrder: z.number(),
      groupId: z.string().nullable(),
      groupType: z.enum(['CIRCUIT', 'SUPERSET']).nullable(),
      coachInstructions: z.string().nullable(),
      notes: z.string().nullable(),
      mediaUrl: z.string().nullable(),
      youtubeUrl: z.string().nullable(),
      lockedFields: z.array(z.string()).optional(),
      repsMin: z.number().nullable(),
      repsMax: z.number().nullable(),
      setsPlanned: z.number().nullable(),
      restSeconds: z.number().nullable(),
      targetRir: z.number().nullable(),
      targetRpe: z.number().nullable(),
      sets: z.array(set),
    }),
  ),
});

import { z } from 'zod';
import { routineComparisonSchema } from './routine-comparison';

export const clearFutureWorkoutsSchema = z.object({
  clientId: z.string().uuid(),
  from: z.string().date(),
  dryRun: z.boolean().optional(),
  candidateTemplateId: z.string().uuid().optional(),
});

export const routineHandoffSchema = z.object({
  mode: z.enum(['continue', 'replace']),
  from: z.string().date(),
  expectedSignature: z.string().regex(/^[a-f0-9]{64}$/),
  candidateTemplateId: z.string().uuid().optional(),
});
export type RoutineHandoff = z.infer<typeof routineHandoffSchema>;

export type HandoffWorkout = {
  id: string;
  type: string;
  date: string;
  planDayId: string | null;
  title: string | null;
  updatedAt: string;
};
export type HandoffSession = {
  id: string;
  date: string;
  planDayId: string | null;
  status: string;
  startedAt: string | null;
  isCompleted: boolean;
  isIncomplete: boolean;
};
export type ProtectedWorkout = HandoffWorkout & { reason: 'started' | 'completed' | 'incomplete' };

const workoutSchema = z.object({
  id: z.string(),
  type: z.string(),
  date: z.string().date(),
  planDayId: z.string().nullable(),
  title: z.string().nullable(),
  updatedAt: z.string(),
});
export const routineHandoffPreviewSchema = z.object({
  clientId: z.string().uuid(),
  from: z.string().date(),
  currentRoutineId: z.string().nullable(),
  removable: z.array(workoutSchema),
  preserved: z.array(workoutSchema.extend({ reason: z.enum(['started', 'completed', 'incomplete']) })),
  signature: z.string(),
  appliedRoutine: z
    .object({
      name: z.string(),
      templateId: z.string(),
      version: z.number(),
      initial: z.boolean(),
      appliedAt: z.string().nullable(),
    })
    .nullable()
    .optional(),
  candidateRoutine: z.object({ name: z.string(), templateId: z.string(), version: z.number() }).optional(),
  comparison: routineComparisonSchema.optional(),
});
export type RoutineHandoffPreview = z.infer<typeof routineHandoffPreviewSchema>;

export function partitionRoutineWorkouts(events: HandoffWorkout[], sessions: HandoffSession[], from: string) {
  const removable: HandoffWorkout[] = [];
  const preserved: ProtectedWorkout[] = [];
  const sorted = events
    .filter((event) => event.type === 'workout' && event.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (const event of sorted) {
    const matching = sessions.filter(
      (session) => session.date === event.date && (!event.planDayId || session.planDayId === event.planDayId),
    );
    const completed = matching.find(
      (session) => !session.isIncomplete && (session.isCompleted || session.status === 'COMPLETED'),
    );
    const incomplete = matching.find((session) => session.isIncomplete);
    const started = matching.find((session) => session.startedAt || session.status === 'IN_PROGRESS');
    const reason = completed ? 'completed' : incomplete ? 'incomplete' : started ? 'started' : null;
    if (reason) preserved.push({ ...event, reason });
    else removable.push(event);
  }
  return { removable, preserved };
}

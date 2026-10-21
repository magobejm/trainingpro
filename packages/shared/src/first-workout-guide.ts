import { z } from 'zod';

export const workoutGuideSteps = ['overview', 'record', 'save', 'sync', 'help'] as const;
export const workoutGuideStateSchema = z
  .object({
    version: z.literal(1),
    status: z.enum(['not_started', 'in_progress', 'completed', 'dismissed']),
    step: z.enum(workoutGuideSteps),
  })
  .strict();
export type WorkoutGuideState = z.infer<typeof workoutGuideStateSchema>;
export type WorkoutGuideStep = WorkoutGuideState['step'];
export const initialWorkoutGuide: WorkoutGuideState = { version: 1, status: 'not_started', step: 'overview' };
export const workoutGuidePatchSchema = workoutGuideStateSchema
  .extend({
    status: z.enum(['in_progress', 'completed', 'dismissed']),
  })
  .refine((state) => state.status !== 'completed' || state.step === 'help', {
    message: 'Complete the help step first',
    path: ['step'],
  });
export const workoutGuideResponseSchema = workoutGuideStateSchema.extend({ eligibleForAutoStart: z.boolean() });
export type WorkoutGuideResponse = z.infer<typeof workoutGuideResponseSchema>;

export function readWorkoutGuide(value: unknown): WorkoutGuideState {
  const parsed = workoutGuideStateSchema.safeParse(value);
  return parsed.success ? parsed.data : { ...initialWorkoutGuide };
}

export function mergeWorkoutGuide(current: WorkoutGuideState, incoming: WorkoutGuideState): WorkoutGuideState {
  if (current.status === 'completed' || current.status === 'dismissed') return current;
  const step =
    workoutGuideSteps.indexOf(incoming.step) > workoutGuideSteps.indexOf(current.step) ? incoming.step : current.step;
  const status = incoming.status === 'not_started' ? current.status : incoming.status;
  return { version: 1, status, step };
}

export function workoutGuideResponse(value: unknown, hasClosedWorkout: boolean): WorkoutGuideResponse {
  const state = readWorkoutGuide(value);
  return {
    ...state,
    eligibleForAutoStart: state.status === 'in_progress' || (state.status === 'not_started' && !hasClosedWorkout),
  };
}

import { z } from 'zod';
import {
  initialWorkoutGuide,
  mergeWorkoutGuide,
  workoutGuideResponseSchema,
  workoutGuideStateSchema,
  type WorkoutGuideResponse,
  type WorkoutGuideState,
  type WorkoutGuideStep,
} from '@trainerpro/shared';

const entrySchema = z.object({
  server: workoutGuideResponseSchema.nullable(),
  pending: workoutGuideStateSchema.nullable(),
  replayStep: z.enum(['overview', 'record', 'save', 'sync', 'help']).nullable(),
  paused: z.boolean(),
});
export type GuideEntry = z.infer<typeof entrySchema>;

export function emptyGuideEntry(): GuideEntry {
  return { server: null, pending: null, replayStep: null, paused: false };
}

export function parseGuideEntry(raw: string | null): GuideEntry {
  try {
    const result = entrySchema.safeParse(JSON.parse(raw ?? 'null'));
    return result.success ? result.data : emptyGuideEntry();
  } catch {
    return emptyGuideEntry();
  }
}

export function guideScope(baseUrl: string, userId: string): string {
  const encode = (part: string) => part.replace(/[^A-Za-z0-9.-]/g, (char) => `_${char.charCodeAt(0).toString(16)}_`);
  return `trainerpro.guide.${encode(baseUrl.replace(/\/+$/, ''))}.${encode(userId)}`;
}

export function effectiveGuide(entry: GuideEntry): WorkoutGuideResponse {
  if (entry.replayStep) return { version: 1, status: 'in_progress', step: entry.replayStep, eligibleForAutoStart: true };
  const base = entry.server ?? initialWorkoutGuide;
  const state = entry.pending ? mergeWorkoutGuide(base, entry.pending) : base;
  const eligible =
    state.status === 'in_progress' || (state.status === 'not_started' && Boolean(entry.server?.eligibleForAutoStart));
  return { ...state, eligibleForAutoStart: eligible };
}

export function advanceGuideEntry(entry: GuideEntry, update: WorkoutGuideState): GuideEntry {
  if (entry.replayStep) return { ...entry, paused: false, replayStep: update.status === 'in_progress' ? update.step : null };
  const current = entry.server ?? initialWorkoutGuide;
  const base = entry.pending ? mergeWorkoutGuide(current, entry.pending) : current;
  if (base.status === 'completed' || base.status === 'dismissed') return entry;
  return { ...entry, paused: false, pending: mergeWorkoutGuide(base, update) };
}

export function reconcileGuideEntry(entry: GuideEntry, remote: WorkoutGuideResponse): GuideEntry {
  const terminal = remote.status === 'completed' || remote.status === 'dismissed';
  const state = entry.server && !terminal ? mergeWorkoutGuide(entry.server, remote) : remote;
  const server: WorkoutGuideResponse = {
    version: 1,
    status: state.status,
    step: state.step,
    eligibleForAutoStart: state.status === 'in_progress' || (state.status === 'not_started' && remote.eligibleForAutoStart),
  };
  const merged = entry.pending ? mergeWorkoutGuide(server, entry.pending) : server;
  const acknowledged = merged.status === server.status && merged.step === server.step;
  return { ...entry, server, pending: acknowledged ? null : merged };
}

export function guideAfterSetSave(entry: GuideEntry, result: unknown, payload: object): GuideEntry {
  const guide = effectiveGuide(entry);
  const hasMeasurement = Object.entries(payload).some(
    ([key, value]) => /Done|^effort|^avgHeartRate/.test(key) && value != null && value !== '',
  );
  if (
    entry.paused ||
    guide.status !== 'in_progress' ||
    !['record', 'save'].includes(guide.step) ||
    !hasMeasurement ||
    (result !== 'pending' && result !== 'synced')
  )
    return entry;
  return advanceGuideEntry(entry, { version: 1, status: 'in_progress', step: 'sync' });
}

export function replayGuideEntry(entry: GuideEntry): GuideEntry {
  const guide = effectiveGuide(entry);
  if (guide.status === 'completed' || guide.status === 'dismissed') {
    return { ...entry, replayStep: 'overview', paused: false };
  }
  return advanceGuideEntry(entry, { version: 1, status: 'in_progress', step: guide.step as WorkoutGuideStep });
}

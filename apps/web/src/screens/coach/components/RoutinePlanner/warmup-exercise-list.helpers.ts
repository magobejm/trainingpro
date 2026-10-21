import type { WarmupTemplateItemInput } from '../../../../data/hooks/useWarmupTemplates';
import { blockTypeShowsRepRange } from '../../exercise-rep-range';
import { resolvePlaceholder } from './ExercisePickerModal.utils';
import type { BlockType } from '../../RoutinePlanner.types';

export function toBlockType(apiBlockType: string): BlockType {
  const valid: BlockType[] = ['strength', 'cardio', 'plio', 'isometric', 'sport', 'mobility'];
  return valid.includes(apiBlockType as BlockType) ? (apiBlockType as BlockType) : 'strength';
}

export function resolveImageUrl(item: WarmupTemplateItemInput, libraryMediaUrl: string | null | undefined): string {
  if (libraryMediaUrl) return libraryMediaUrl;
  return resolvePlaceholder(toBlockType(item.blockType));
}

export function resolveLibraryId(item: WarmupTemplateItemInput): string | null {
  if (item.exerciseLibraryId) return item.exerciseLibraryId;
  if (item.mobilityExerciseLibraryId) return item.mobilityExerciseLibraryId;
  if (item.cardioMethodLibraryId) return item.cardioMethodLibraryId;
  if (item.plioExerciseLibraryId) return item.plioExerciseLibraryId;
  if (item.isometricExerciseLibraryId) return item.isometricExerciseLibraryId;
  if (item.sportLibraryId) return item.sportLibraryId;
  return null;
}

export type PerSet = {
  setIndex: number;
  distanceMeters?: number;
  durationSeconds?: number;
  fcMaxPct?: number;
  fcReservePct?: number;
  heartRate?: number;
  reps?: number;
  rpe?: number;
  weightKg?: number;
  rir?: number;
  restSeconds?: number;
  rom?: string;
  note?: string;
};

export function parseSets(item: WarmupTemplateItemInput): PerSet[] {
  const raw = (item.metadataJson as Record<string, unknown> | null | undefined)?.sets;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => s !== null && typeof s === 'object')
    .map((s, i) => ({
      setIndex: typeof s.setIndex === 'number' ? s.setIndex : i,
      distanceMeters: typeof s.distanceMeters === 'number' ? s.distanceMeters : undefined,
      durationSeconds: typeof s.durationSeconds === 'number' ? s.durationSeconds : undefined,
      fcMaxPct: typeof s.fcMaxPct === 'number' ? s.fcMaxPct : undefined,
      fcReservePct: typeof s.fcReservePct === 'number' ? s.fcReservePct : undefined,
      heartRate: typeof s.heartRate === 'number' ? s.heartRate : undefined,
      reps: typeof s.reps === 'number' ? s.reps : undefined,
      rpe: typeof s.rpe === 'number' ? s.rpe : undefined,
      weightKg: typeof s.weightKg === 'number' ? s.weightKg : undefined,
      rir: typeof s.rir === 'number' ? s.rir : undefined,
      restSeconds: typeof s.restSeconds === 'number' ? s.restSeconds : undefined,
      rom: typeof s.rom === 'string' && s.rom ? s.rom : undefined,
      note: typeof s.note === 'string' && s.note.trim() ? s.note : undefined,
    }));
}

/** Table rows: merge API sets with planned count so empty templates still list series. */
export function resolveDisplaySets(item: WarmupTemplateItemInput): PerSet[] {
  const parsed = parseSets(item);
  const planned = item.setsPlanned ?? item.roundsPlanned ?? 0;
  const legacySeconds = ['cardio', 'sport'].includes(toBlockType(item.blockType))
    ? (item.workSeconds ?? (item.durationMinutes == null ? undefined : item.durationMinutes * 60))
    : undefined;
  const n = Math.max(planned, parsed.length, legacySeconds == null ? 0 : 1);
  if (n <= 0) return [];

  const rows: PerSet[] = [];
  for (let i = 0; i < n; i++) {
    const fromParsed = parsed.find((s) => s.setIndex === i);
    const row = fromParsed ? { ...fromParsed, setIndex: i } : { setIndex: i };
    if (row.durationSeconds == null && legacySeconds != null) row.durationSeconds = legacySeconds;
    rows.push(row);
  }
  return rows;
}

export type MainFieldChip = { label: string; value: string };

/** Primary summary chips in the warm-up template picker, by block type. */
export function buildWarmupMainFieldChips(item: WarmupTemplateItemInput, t: (key: string) => string): MainFieldChip[] {
  const dash = t('coach.routine.seriesTable.placeholderDash');
  const seriesVal = item.setsPlanned ?? item.roundsPlanned;
  const repsRange =
    item.repsMin != null || item.repsMax != null
      ? item.repsMin === item.repsMax
        ? String(item.repsMin ?? item.repsMax)
        : `${item.repsMin ?? '?'} - ${item.repsMax ?? '?'}`
      : undefined;

  const pushSeries = (out: MainFieldChip[]) => {
    out.push({
      label: t('coach.routine.block.sets'),
      value: seriesVal != null ? String(seriesVal) : dash,
    });
  };
  const pushRepsRange = (out: MainFieldChip[]) => {
    out.push({
      label: t('coach.routine.block.repsRange'),
      value: repsRange ?? dash,
    });
  };
  const out: MainFieldChip[] = [];
  pushSeries(out);
  if (blockTypeShowsRepRange(item.blockType)) pushRepsRange(out);

  return out;
}

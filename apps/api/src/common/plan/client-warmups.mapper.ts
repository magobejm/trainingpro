import { normalizeLegacyLockedFields, resolveLockedFields } from '@trainerpro/shared';
import type { Prisma } from '@prisma/client';
import type { ClientRoutineWarmup, ClientRoutineExercise } from '@trainerpro/shared';
import { resolveClientRoutineSets, type PlanSetRow } from './client-routine-set.mapper';
import { stripMetaNotes } from '../notes/parse-meta-notes';

const media = { select: { mediaUrl: true, youtubeUrl: true, coachInstructions: true } } as const;
export const CLIENT_WARMUPS_INCLUDE = {
  orderBy: { sortOrder: 'asc' as const },
  include: {
    warmupTemplate: {
      include: {
        items: {
          where: { archivedAt: null },
          orderBy: { sortOrder: 'asc' as const },
          include: {
            group: true,
            libraryExercise: media,
            libraryCardioMethod: media,
            libraryPlioExercise: media,
            libraryMobilityExercise: media,
          },
        },
      },
    },
  },
} as const;
type Reference = Prisma.PlanDayWarmupGetPayload<typeof CLIENT_WARMUPS_INCLUDE>;
type Media = { mediaUrl: string | null; youtubeUrl: string | null; coachInstructions: string | null };

/** Resolve all warmup types without turning their prescriptions into session items. */
export async function mapClientWarmups(
  db: Prisma.TransactionClient,
  references: Reference[] = [],
): Promise<ClientRoutineWarmup[]> {
  const items = references.flatMap((ref) => ref.warmupTemplate.items);
  const iso = items.flatMap((item) => (item.isometricExerciseLibraryId ? [item.isometricExerciseLibraryId] : []));
  const sports = items.flatMap((item) => (item.sportLibraryId ? [item.sportLibraryId] : []));
  const extras = new Map<string, Media>();
  if (iso.length)
    for (const row of await db.isometricExercise.findMany({
      where: { id: { in: iso } },
      select: { id: true, ...media.select },
    }))
      extras.set(row.id, row);
  if (sports.length)
    for (const row of await db.sport.findMany({ where: { id: { in: sports } }, select: { id: true, ...media.select } }))
      extras.set(row.id, row);
  return references
    .map(({ id: referenceId, warmupTemplate: template }) => ({
      id: referenceId,
      name: template.name,
      description: null,
      exercises: template.items.map((item): ClientRoutineExercise => {
        const library =
          item.libraryExercise ??
          item.libraryCardioMethod ??
          item.libraryPlioExercise ??
          item.libraryMobilityExercise ??
          extras.get(item.isometricExerciseLibraryId ?? item.sportLibraryId ?? '');
        const type = item.blockType as ClientRoutineExercise['type'];
        const metadata = item.metadataJson as {
          sets?: PlanSetRow[];
          lockedFields?: string[];
          setVariablesVersion?: number;
        } | null;
        const prescribed = (Array.isArray(metadata?.sets) ? metadata.sets : [])
          .filter((set) => set != null && typeof set === 'object')
          .map((set, index) => ({ ...set, setIndex: typeof set.setIndex === 'number' ? set.setIndex : index }));
        const hasPrescription =
          item.workSeconds != null || item.durationMinutes != null || item.repsMin != null || item.repsMax != null;
        const count = Math.max(item.setsPlanned ?? item.roundsPlanned ?? (hasPrescription ? 1 : 0), prescribed.length);
        const sets = Array.from(
          { length: count },
          (_, setIndex): PlanSetRow => ({
            durationSeconds: item.workSeconds ?? (item.durationMinutes == null ? null : item.durationMinutes * 60),
            ...prescribed.find((set) => set.setIndex === setIndex),
            setIndex,
          }),
        );
        return {
          id: `${referenceId}:${item.id}`,
          displayName: item.displayName,
          type,
          sortOrder: item.sortOrder,
          groupId: item.groupId,
          groupType:
            item.group?.groupType === 'CIRCUIT' || item.group?.groupType === 'SUPERSET' ? item.group.groupType : null,
          coachInstructions: library?.coachInstructions ?? null,
          notes: stripMetaNotes(item.notes),
          mediaUrl: library?.mediaUrl ?? null,
          youtubeUrl: library?.youtubeUrl ?? null,
          lockedFields:
            metadata?.setVariablesVersion === 2
              ? resolveLockedFields(type, metadata.lockedFields)
              : normalizeLegacyLockedFields(type, metadata?.lockedFields),
          repsMin: item.repsMin,
          repsMax: item.repsMax,
          restSeconds: item.restSeconds,
          targetRir: item.targetRir,
          targetRpe: item.targetRpe == null ? null : Number(item.targetRpe),
          setsPlanned: count,
          sets: resolveClientRoutineSets(sets, type, {
            ...item,
            setsPlanned: count,
            targetRpe: item.targetRpe == null ? null : Number(item.targetRpe),
          }),
        };
      }),
    }))
    .filter((warmup) => warmup.exercises.length > 0);
}

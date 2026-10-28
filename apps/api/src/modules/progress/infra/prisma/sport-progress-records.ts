import type { Prisma } from '@prisma/client';
import { toRpeNumber } from '../../../../common/plan/rpe-number';
import { sportSetHasData, sportLogHasData } from '../../../../common/performed-set';

type SportRecord = Omit<Parameters<typeof sportSetHasData>[0], 'effortRpe' | 'weightDoneKg'> & {
  sessionSportBlockId?: string;
  effortRpe: Prisma.Decimal | number | null;
  weightDoneKg?: Prisma.Decimal | number | null;
  durationMinutesDone?: number | null;
  avgHeartRate?: number | null;
  heartRateDone?: number | null;
  heartRateDoneMax?: number | null;
};

/** Recorded sets supersede the legacy summary only within their own sport block. */
export function selectRecordedSportRecords<TSet extends SportRecord, TLegacy extends SportRecord>(
  setRows: TSet[],
  legacyRows: TLegacy[],
) {
  const sets = setRows.filter((row) =>
    sportSetHasData({
      ...row,
      effortRpe: toRpeNumber(row.effortRpe),
      weightDoneKg: row.weightDoneKg == null ? null : Number(row.weightDoneKg),
    }),
  );
  const recordedBlocks = new Set(sets.map((row) => row.sessionSportBlockId));
  const legacy = legacyRows.filter(
    (row) =>
      !recordedBlocks.has(row.sessionSportBlockId) && sportLogHasData({ ...row, effortRpe: toRpeNumber(row.effortRpe) }),
  );
  return { sets, legacy };
}

/** Full observed records let a distance-only set suppress its own legacy summary too. */
export const sportRecordsSelect = { sportSetLogs: true, sportLogs: true } as const;

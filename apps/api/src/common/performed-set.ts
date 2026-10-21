export function isRecordedNumber(value: null | number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isRecordedNonNegative(value: null | number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function sumRecordedOrNull(values: Array<null | number | undefined>): number | null {
  const present = values.filter(isRecordedNonNegative);
  return present.length ? present.reduce((sum, value) => sum + value, 0) : null;
}

export function isRecordedText(value: null | string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function averageRecorded(values: Array<null | number | undefined>): number | null {
  const present = values.filter(isRecordedNumber);
  if (present.length === 0) return null;
  const sum = present.reduce((total, value) => total + value, 0);
  return Math.round((sum / present.length) * 100) / 100;
}

export function sumRecorded(values: Array<null | number | undefined>): number {
  let total = 0;
  for (const value of values) {
    if (isRecordedNumber(value)) total += value;
  }
  return total;
}

type StrengthFields = {
  effortRir?: null | number;
  effortRpe?: null | number;
  repsDone?: null | number;
  weightDoneKg?: null | number;
};

export function strengthSetHasData(set: StrengthFields): boolean {
  return (
    isRecordedNonNegative(set.repsDone) ||
    isRecordedNumber(set.effortRpe) ||
    isRecordedNonNegative(set.weightDoneKg) ||
    isRecordedNonNegative(set.effortRir)
  );
}

type PlioFields = StrengthFields & { durationSecondsDone?: null | number };

export function plioSetHasData(set: PlioFields): boolean {
  return strengthSetHasData(set) || isRecordedNonNegative(set.durationSecondsDone);
}

type IsometricFields = {
  durationSecondsDone?: null | number;
  effortRpe?: null | number;
  weightDoneKg?: null | number;
};

export function isometricSetHasData(set: IsometricFields): boolean {
  return (
    isRecordedNonNegative(set.durationSecondsDone) ||
    isRecordedNumber(set.effortRpe) ||
    isRecordedNonNegative(set.weightDoneKg)
  );
}

type MobilityFields = StrengthFields & { romDone?: null | string };

export function mobilitySetHasData(set: MobilityFields): boolean {
  return strengthSetHasData(set) || isRecordedText(set.romDone);
}

type CardioFields = {
  hrMaxPctDone?: null | number;
  hrReservePctDone?: null | number;
  avgHeartRate?: null | number;
  distanceDoneMeters?: null | number;
  durationSecondsDone?: null | number;
  effortRpe?: null | number;
};

export function cardioIntervalHasData(row: CardioFields): boolean {
  if ([row.hrMaxPctDone, row.hrReservePctDone].some(isRecordedNonNegative)) return true;
  return (
    isRecordedNonNegative(row.durationSecondsDone) ||
    isRecordedNonNegative(row.distanceDoneMeters) ||
    [row.effortRpe, row.avgHeartRate].some(isRecordedNumber)
  );
}

type SportLogFields = {
  avgHeartRate?: null | number;
  durationMinutesDone?: null | number;
  effortRpe?: null | number;
};

export function sportLogHasData(row: SportLogFields): boolean {
  return [row.durationMinutesDone, row.effortRpe, row.avgHeartRate].some(isRecordedNumber);
}

type SportSetFields = {
  distanceDoneMeters?: null | number;
  durationSecondsDone?: null | number;
  effortRir?: null | number;
  effortRpe?: null | number;
  heartRateDone?: null | number;
  hrMaxPctDone?: null | number;
  hrReservePctDone?: null | number;
  repsDone?: null | number;
  romDone?: null | string;
  weightDoneKg?: null | number;
};

export function sportSetHasData(set: SportSetFields): boolean {
  const numbers = [
    set.repsDone,
    set.weightDoneKg,
    set.effortRpe,
    set.effortRir,
    set.distanceDoneMeters,
    set.durationSecondsDone,
    set.heartRateDone,
    set.hrMaxPctDone,
    set.hrReservePctDone,
  ];
  return (
    numbers.some(isRecordedNumber) ||
    [set.repsDone, set.durationSecondsDone, set.distanceDoneMeters, set.hrMaxPctDone, set.hrReservePctDone].some(
      isRecordedNonNegative,
    ) ||
    isRecordedNonNegative(set.weightDoneKg) ||
    isRecordedNonNegative(set.effortRir) ||
    isRecordedText(set.romDone)
  );
}

export function sportLoadFromLog(
  durationMinutes: null | number,
  effortRpe: null | number,
): { inol: number; tonnage: number } | null {
  if (!isRecordedNumber(durationMinutes) || !isRecordedNumber(effortRpe)) return null;
  return {
    inol: (durationMinutes * effortRpe) / 10,
    tonnage: durationMinutes * Math.max(1, effortRpe),
  };
}

export function filterPerformedSourceIds<T>(
  items: Array<{ logs: T[]; sourceId: null | string }>,
  hasData: (log: T) => boolean,
): string[] {
  const ids = items
    .filter((item) => item.sourceId !== null && item.logs.some(hasData))
    .map((item) => item.sourceId as string);
  return [...new Set(ids)];
}

export function summarizePlioSets(sets: PlioFields[]): {
  avgRpe: number | null;
  sets: number;
  tonnage: number | null;
  totalReps: number | null;
} {
  const performed = sets.filter(plioSetHasData);
  let tonnage = 0;
  for (const set of performed) {
    if (isRecordedNonNegative(set.weightDoneKg) && isRecordedNonNegative(set.repsDone)) {
      tonnage += set.weightDoneKg * set.repsDone;
    }
  }
  return {
    avgRpe: averageRecorded(performed.map((set) => set.effortRpe)),
    sets: performed.length,
    tonnage: performed.some(
      (set) =>
        isRecordedNonNegative(set.weightDoneKg) &&
        ('repsDone' in set
          ? isRecordedNonNegative(set.repsDone as number | null)
          : 'durationSecondsDone' in set && isRecordedNonNegative(set.durationSecondsDone as number | null)),
    )
      ? Math.round(tonnage * 100) / 100
      : null,
    totalReps: sumRecordedOrNull(performed.map((set) => set.repsDone)),
  };
}

export function summarizeIsometricSets(sets: IsometricFields[]): {
  avgRpe: number | null;
  plioEffort: number | null;
  sets: number;
  tonnage: number | null;
  totalDurationSeconds: number | null;
} {
  const performed = sets.filter(isometricSetHasData);
  const totalDurationSeconds = sumRecorded(performed.map((set) => set.durationSecondsDone));
  const avgRpe = averageRecorded(performed.map((set) => set.effortRpe));
  let tonnage = 0;
  for (const set of performed) {
    if (isRecordedNonNegative(set.weightDoneKg) && isRecordedNonNegative(set.durationSecondsDone)) {
      tonnage += set.weightDoneKg * (set.durationSecondsDone / 60);
    }
  }
  const effortSets = performed.filter(
    (set) => isRecordedNonNegative(set.durationSecondsDone) && isRecordedNumber(set.effortRpe),
  );
  const plioEffort = effortSets.length
    ? Math.round(effortSets.reduce((sum, set) => sum + ((set.durationSecondsDone! / 60) * set.effortRpe!) / 10, 0) * 100) /
      100
    : null;
  return {
    avgRpe,
    plioEffort,
    sets: performed.length,
    tonnage: performed.some(
      (set) =>
        isRecordedNonNegative(set.weightDoneKg) &&
        ('repsDone' in set
          ? isRecordedNonNegative(set.repsDone as number | null)
          : 'durationSecondsDone' in set && isRecordedNonNegative(set.durationSecondsDone as number | null)),
    )
      ? Math.round(tonnage * 100) / 100
      : null,
    totalDurationSeconds: performed.some((set) => isRecordedNonNegative(set.durationSecondsDone))
      ? totalDurationSeconds
      : null,
  };
}

export function summarizeMobilitySets(sets: MobilityFields[]): {
  avgRpe: number | null;
  sets: number;
  totalReps: number | null;
} {
  const performed = sets.filter(mobilitySetHasData);
  return {
    avgRpe: averageRecorded(performed.map((set) => set.effortRpe)),
    sets: performed.length,
    totalReps: sumRecordedOrNull(performed.map((set) => set.repsDone)),
  };
}

export function summarizeCardioIntervals(rows: CardioFields[]): {
  avgHeartRate: number | null;
  avgRpe: number | null;
  sets: number;
  totalDistanceMeters: number | null;
  totalDurationSeconds: number | null;
} {
  const performed = rows.filter(cardioIntervalHasData);
  let hrWeighted = 0;
  let hrWeightSecs = 0;
  for (const row of performed) {
    if (isRecordedNumber(row.avgHeartRate) && isRecordedNumber(row.durationSecondsDone)) {
      hrWeighted += row.avgHeartRate * row.durationSecondsDone;
      hrWeightSecs += row.durationSecondsDone;
    }
  }
  return {
    avgHeartRate: hrWeightSecs > 0 ? Math.round(hrWeighted / hrWeightSecs) : null,
    avgRpe: averageRecorded(performed.map((row) => row.effortRpe)),
    sets: performed.length,
    totalDistanceMeters: sumRecordedOrNull(performed.map((row) => row.distanceDoneMeters)),
    totalDurationSeconds: sumRecordedOrNull(performed.map((row) => row.durationSecondsDone)),
  };
}

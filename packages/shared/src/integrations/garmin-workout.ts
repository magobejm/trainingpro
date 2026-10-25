export type GarminCardioBlock = {
  displayName: string;
  distanceMeters?: number | null;
  fcMaxPct?: number | null;
  fcReservePct?: number | null;
  heartRate?: number | null;
  restSeconds: number;
  roundsPlanned: number;
  workSeconds: number;
};

export type GarminWorkoutStep = {
  description: string;
  distanceMeters?: number;
  durationSeconds?: number;
  targetHeartRate: number | null;
  type: 'interval' | 'rest';
};

export type GarminWorkout = {
  name: string;
  steps: GarminWorkoutStep[];
};

export function mapCardioToGarminWorkout(input: {
  blocks: GarminCardioBlock[];
  fcMax: number | null;
  fcRest: number | null;
  name: string;
}): GarminWorkout {
  const steps: GarminWorkoutStep[] = [];
  for (const block of input.blocks) {
    const rounds = Math.max(1, block.roundsPlanned);
    const target = heartRateTarget(block, input.fcMax, input.fcRest);
    for (let round = 0; round < rounds; round += 1) {
      steps.push({
        description: block.displayName,
        distanceMeters: block.distanceMeters ?? undefined,
        durationSeconds: block.workSeconds,
        targetHeartRate: target,
        type: 'interval',
      });
      if (block.restSeconds > 0) {
        steps.push({
          description: block.displayName,
          durationSeconds: block.restSeconds,
          targetHeartRate: null,
          type: 'rest',
        });
      }
    }
  }
  return { name: input.name, steps };
}

export function heartRateTarget(block: GarminCardioBlock, fcMax: number | null, fcRest: number | null): number | null {
  if (block.heartRate != null) return block.heartRate;
  if (block.fcMaxPct != null && fcMax != null) return Math.round((fcMax * block.fcMaxPct) / 100);
  if (block.fcReservePct != null && fcMax != null && fcRest != null) {
    return Math.round(fcRest + ((fcMax - fcRest) * block.fcReservePct) / 100);
  }
  return null;
}

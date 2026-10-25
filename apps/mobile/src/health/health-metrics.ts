export function sleepScore(hours: number | null): number | null {
  if (hours == null || !Number.isFinite(hours) || hours < 0) return null;
  if (hours < 5) return 1;
  if (hours < 6) return 2;
  if (hours < 7) return 3;
  if (hours < 8) return 4;
  return 5;
}

export function stepsTarget(title: string): number | null {
  const match = /(\d[\d.\s]*)\s*(?:pasos|steps)/i.exec(title);
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(/[.\s]/g, ''));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function aggregateHeartRate(samples: readonly number[]): { average: number; max: number } | null {
  const beats = samples.filter((sample) => Number.isFinite(sample) && sample > 0);
  if (beats.length === 0) return null;
  const total = beats.reduce((sum, sample) => sum + sample, 0);
  return { average: Math.round(total / beats.length), max: Math.max(...beats) };
}

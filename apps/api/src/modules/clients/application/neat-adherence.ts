export type NeatAdherence = {
  done: number;
  expected: number;
  percent: number | null;
};

export function neatAdherence(done: number, expected: number): NeatAdherence {
  return {
    done,
    expected,
    percent: expected > 0 ? Math.round((done / expected) * 10000) / 100 : null,
  };
}

export function inclusiveDayCount(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

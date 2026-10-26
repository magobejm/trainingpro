import {
  applyProgression,
  loadSuggestionKg,
  parseProgressionRule,
  progressionMicrocycleIndex,
  suggestLoadIncrease,
  type ProgressionRule,
} from '../progression/apply-progression';

const base = [0, 1, 2].map((setIndex) => ({ note: 'n', reps: 8, rir: 3, setIndex, weightKg: 100 }));
const rule: ProgressionRule = {
  microcycles: [{ rirTarget: 3 }, { rirTarget: 2 }, { rirTarget: 1, setsDelta: 1 }, { deload: true }],
};

describe('progressionMicrocycleIndex', () => {
  const applied = new Date('2026-01-01T00:00:00Z');
  const at = (days: number) => new Date(applied.getTime() + days * 86400000);

  it('counts 7-day microcycles by default and repeats the mesocycle', () => {
    expect(progressionMicrocycleIndex(applied, at(0), null, 4)).toBe(0);
    expect(progressionMicrocycleIndex(applied, at(6), null, 4)).toBe(0);
    expect(progressionMicrocycleIndex(applied, at(7), null, 4)).toBe(1);
    expect(progressionMicrocycleIndex(applied, at(27), null, 4)).toBe(3);
    expect(progressionMicrocycleIndex(applied, at(28), null, 4)).toBe(0);
  });

  it('honours a custom microcycle length', () => {
    expect(progressionMicrocycleIndex(applied, at(9), 10, 4)).toBe(0);
    expect(progressionMicrocycleIndex(applied, at(10), 10, 4)).toBe(1);
    expect(progressionMicrocycleIndex(applied, at(40), 10, 4)).toBe(0);
  });

  it('never goes negative before the assignment', () => {
    expect(progressionMicrocycleIndex(applied, at(-5), 7, 4)).toBe(0);
  });
});

describe('applyProgression', () => {
  it('lowers the RIR target week by week', () => {
    expect(applyProgression(base, rule, 0).map((set) => set.rir)).toEqual([3, 3, 3]);
    expect(applyProgression(base, rule, 1).map((set) => set.rir)).toEqual([2, 2, 2]);
  });

  it('adds a set cloned from the last one', () => {
    const result = applyProgression(base, rule, 2);
    expect(result).toHaveLength(4);
    expect(result[3]).toMatchObject({ note: 'n', rir: 1, setIndex: 3, weightKg: 100 });
  });

  it('deloads with fewer sets, less load and more RIR', () => {
    const result = applyProgression(base, rule, 3);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ rir: 5, weightKg: 60 });
  });

  it('applies loadPct and loadDeltaKg', () => {
    const pct = applyProgression(base, { microcycles: [{ loadPct: 1.05 }] }, 0);
    expect(pct[0]?.weightKg).toBe(105);
    const delta = applyProgression(base, { microcycles: [{ loadDeltaKg: 2.5 }] }, 0);
    expect(delta[0]?.weightKg).toBe(102.5);
  });

  it('applies the percentage first and then the kg adjustment', () => {
    const result = applyProgression(base, { microcycles: [{ loadPct: 0.9, loadDeltaKg: 2.5 }] }, 0);
    expect(result[0]?.weightKg).toBe(92.5);
  });

  it('clamps an out of range index and keeps empty weight untouched', () => {
    const noWeight = [{ reps: 8, rir: 2, setIndex: 0, weightKg: null }];
    expect(applyProgression(noWeight, rule, 99)[0]?.weightKg).toBeNull();
    expect(applyProgression(base, rule, 99)).toHaveLength(2);
  });

  it('does not mutate the base sets', () => {
    applyProgression(base, rule, 2);
    expect(base).toHaveLength(3);
    expect(base[0]?.rir).toBe(3);
  });
});

describe('parseProgressionRule', () => {
  it('rejects empty or invalid rules', () => {
    expect(parseProgressionRule(null)).toBeNull();
    expect(parseProgressionRule({ microcycles: [] })).toBeNull();
    expect(parseProgressionRule({ microcycles: [{ rirTarget: 99 }] })).toBeNull();
    expect(parseProgressionRule(rule)).not.toBeNull();
  });
});

describe('suggestLoadIncrease', () => {
  const auto = { incrementKg: 2.5, rirAtOrAbove: 2, whenRepsAtTop: true };
  const top = [
    { reps: 10, rir: 2, weightKg: 80 },
    { reps: 10, rir: 3, weightKg: 80 },
  ];

  it('suggests the increment when reps and RIR are met', () => {
    expect(suggestLoadIncrease(top, { repsMax: 10 }, auto)).toBe(82.5);
  });

  it('does not suggest a load increase on a deload microcycle', () => {
    expect(loadSuggestionKg({ deload: true }, 102.5)).toBeNull();
    expect(loadSuggestionKg({ deload: true, loadPct: 0.6 }, 102.5)).toBeNull();
  });

  it('keeps the suggestion on a microcycle that is not a deload', () => {
    expect(loadSuggestionKg({ rirTarget: 1, setsDelta: 1 }, 102.5)).toBe(102.5);
    expect(loadSuggestionKg({ rirTarget: 1 }, null)).toBeNull();
  });

  it('stays quiet when reps, RIR or the rule are missing', () => {
    expect(suggestLoadIncrease([{ reps: 9, rir: 3, weightKg: 80 }], { repsMax: 10 }, auto)).toBeNull();
    expect(suggestLoadIncrease([{ reps: 10, rir: 1, weightKg: 80 }], { repsMax: 10 }, auto)).toBeNull();
    expect(suggestLoadIncrease(top, { repsMax: 10 }, null)).toBeNull();
    expect(suggestLoadIncrease([], { repsMax: 10 }, auto)).toBeNull();
  });
});

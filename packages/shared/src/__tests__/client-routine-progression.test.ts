import {
  applyCommandRule,
  applyCommandRulesToSet,
  applyCommandSetCount,
  cascadeCandidates,
  normalizeCommandRules,
  previewCommandExercise,
  type CommandRule,
  type CommandSetValues,
} from '../client-routine-progression';

const set = (patch: Partial<CommandSetValues> = {}): CommandSetValues => ({
  reps: 8,
  restSeconds: 90,
  rir: 2,
  rpe: 8,
  weightKg: 100,
  ...patch,
});

describe('applyCommandRule', () => {
  it('adds a delta to the value of each week', () => {
    expect(applyCommandRule('weightKg', 100, { mode: 'delta', value: 2.5 }).value).toBe(102.5);
    expect(applyCommandRule('weightKg', 80, { mode: 'delta', value: 2.5 }).value).toBe(82.5);
  });

  it('applies a percentage to the own value', () => {
    expect(applyCommandRule('weightKg', 80, { mode: 'percent', value: 5 }).value).toBe(84);
    expect(applyCommandRule('reps', 10, { mode: 'percent', value: 15 }).value).toBe(12);
  });

  it('keeps 0 and warns when a percentage hits body weight or zero', () => {
    expect(applyCommandRule('weightKg', 0, { mode: 'percent', value: 10 })).toEqual({ value: 0, warning: 'zeroPercent' });
  });

  it('keeps empty values empty on relative rules and fills them on absolute ones', () => {
    expect(applyCommandRule('rpe', null, { mode: 'delta', value: 1 })).toEqual({ value: null, warning: 'emptyDelta' });
    expect(applyCommandRule('rpe', null, { mode: 'set', value: 7 }).value).toBe(7);
  });

  it('never leaves the valid range', () => {
    expect(applyCommandRule('rpe', 9.5, { mode: 'delta', value: 3 }).value).toBe(10);
    expect(applyCommandRule('reps', 2, { mode: 'delta', value: -5 }).value).toBe(0);
  });
});

describe('applyCommandRulesToSet', () => {
  it('applies several variables and collects warnings once', () => {
    const rules: CommandRule[] = [
      { mode: 'delta', value: 1, variable: 'reps' },
      { mode: 'percent', value: 10, variable: 'weightKg' },
    ];
    const result = applyCommandRulesToSet(set({ weightKg: 0 }), rules);
    expect(result.after).toMatchObject({ reps: 9, weightKg: 0 });
    expect(result.warnings).toEqual(['zeroPercent']);
  });
});

describe('applyCommandSetCount and previewCommandExercise', () => {
  it('adds and removes series without going under one', () => {
    expect(applyCommandSetCount(3, [{ mode: 'delta', value: 1, variable: 'sets' }])).toBe(4);
    expect(applyCommandSetCount(3, [{ mode: 'delta', value: -5, variable: 'sets' }])).toBe(1);
    expect(applyCommandSetCount(3, [{ mode: 'set', value: 5, variable: 'sets' }])).toBe(5);
  });

  it('copies the last set when adding and drops from the end when removing', () => {
    const sets = [set({ weightKg: 60 }), set({ weightKg: 70 })];
    const more = previewCommandExercise(sets, [{ mode: 'delta', value: 1, variable: 'sets' }]);
    expect(more.map((item) => item.after.weightKg)).toEqual([60, 70, 70]);
    const fewer = previewCommandExercise(sets, [{ mode: 'delta', value: -1, variable: 'sets' }]);
    expect(fewer.map((item) => item.after.weightKg)).toEqual([60]);
  });
});

describe('normalizeCommandRules and cascadeCandidates', () => {
  it('drops repeated variables', () => {
    const rules = normalizeCommandRules([
      { mode: 'delta', value: 1, variable: 'reps' },
      { mode: 'delta', value: 2, variable: 'reps' },
    ]);
    expect(rules).toHaveLength(1);
  });

  it('asks only when there are later weeks that were not selected', () => {
    expect(cascadeCandidates([1, 2], [1, 2, 3, 4])).toEqual({ later: [3, 4], shouldAsk: true });
    expect(cascadeCandidates([1, 2, 3, 4], [1, 2, 3, 4])).toEqual({ later: [], shouldAsk: false });
    expect(cascadeCandidates([4], [1, 2, 3, 4])).toEqual({ later: [], shouldAsk: false });
    expect(cascadeCandidates([2, 4], [2, 3, 4, 5])).toEqual({ later: [5], shouldAsk: true });
  });
});

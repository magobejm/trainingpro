import {
  applyCommandRule,
  applyCommandRulesToSet,
  applyCommandSetCount,
  cascadeCandidates,
  commandChoice,
  commandItemInScope,
  commandTargetForRules,
  commandTouchesSet,
  normalizeCommandRules,
  previewCommandExercise,
  previewCommandTimedSets,
  rulesForChoice,
  toggleCommandAll,
  toggleCommandExercise,
  toggleCommandSet,
  type CommandItemRef,
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

describe('previewCommandTimedSets', () => {
  const timed = { distanceMeters: 5000, durationSeconds: 1200, fcMaxPct: 70, heartRate: null };

  it('applies duration, distance and heart-rate rules to each set', () => {
    const [row] = previewCommandTimedSets(
      [timed],
      [
        { mode: 'delta', value: 300, variable: 'durationSeconds' },
        { mode: 'percent', value: 10, variable: 'distanceMeters' },
        { mode: 'delta', value: 5, variable: 'fcMaxPct' },
      ],
    );
    expect(row!.after).toEqual({ distanceMeters: 5500, durationSeconds: 1500, fcMaxPct: 75, heartRate: null });
  });

  it('keeps empty values empty on relative rules, ignores strength variables and caps %FC at 100', () => {
    const [row] = previewCommandTimedSets(
      [timed],
      [
        { mode: 'delta', value: 10, variable: 'heartRate' },
        { mode: 'delta', value: 5, variable: 'weightKg' },
        { mode: 'delta', value: 50, variable: 'fcMaxPct' },
      ],
    );
    expect(row!.after.heartRate).toBeNull();
    expect(row!.warnings).toContain('emptyDelta');
    expect(row!.after.fcMaxPct).toBe(100);
  });
});

describe('command scope', () => {
  const squat: CommandItemRef = { dayIndex: 0, displayName: 'Sentadilla', kind: 'exercise', sortOrder: 0 };
  const bench: CommandItemRef = { dayIndex: 0, displayName: 'Press', kind: 'exercise', sortOrder: 1 };
  const run: CommandItemRef = { dayIndex: 0, displayName: 'Correr', kind: 'cardio', sortOrder: 2 };
  const hold: CommandItemRef = { dayIndex: 0, displayName: 'Plancha', kind: 'isometric', sortOrder: 3 };
  const visible = [squat, bench];
  const weight: CommandRule = { mode: 'delta', value: 2.5, variable: 'weightKg' };
  const duration: CommandRule = { mode: 'delta', value: 10, variable: 'durationSeconds' };
  const sets: CommandRule = { mode: 'delta', value: 1, variable: 'sets' };

  it('keeps the marked sets and drops a change to the set count on a partial exercise', () => {
    const target = toggleCommandSet(undefined, squat, 0, 3, visible);
    const choice = commandChoice(squat, [weight], target);
    expect(commandItemInScope(bench, [weight], target)).toBe(true);
    expect(choice?.setIndexes).toEqual([1, 2]);
    expect(commandTouchesSet(choice, 1)).toBe(true);
    expect(commandTouchesSet(choice, 0)).toBe(false);
    expect(rulesForChoice([weight, sets], choice)).toEqual([weight]);
  });

  it('widens a partial exercise to every set when the set count changes', () => {
    const picked = toggleCommandSet(toggleCommandExercise(undefined, bench, visible), squat, 0, 3, visible);
    const choice = commandChoice(squat, [sets], picked);
    expect(choice?.setIndexes).toBeUndefined();
    expect(commandItemInScope(bench, [sets], picked)).toBe(false);
    expect(rulesForChoice([sets], choice)).toEqual([sets]);
    expect(commandTargetForRules(picked, [sets], visible).scope).toBe('selection');
    expect(commandTargetForRules({ scope: 'selection', items: [squat, bench] }, [sets], visible)).toEqual({
      scope: 'kind',
    });
  });

  it('marks several exercises and leaves the ones that were unchecked', () => {
    const target = toggleCommandExercise(undefined, bench, visible);
    expect(commandItemInScope(squat, [weight], target)).toBe(true);
    expect(commandItemInScope(bench, [weight], target)).toBe(false);
    expect(commandTouchesSet(commandChoice(squat, [weight], target), 2)).toBe(true);
    expect(toggleCommandAll(target)).toEqual({ scope: 'kind' });
    expect(toggleCommandAll({ scope: 'kind' })).toEqual({ scope: 'selection', items: [] });
  });

  it('sends weight to strength only, and duration to cardio and isometric', () => {
    expect(commandItemInScope(run, [weight], { scope: 'kind' })).toBe(false);
    expect(commandItemInScope(squat, [weight], { scope: 'kind' })).toBe(true);
    expect(commandItemInScope(hold, [duration], { scope: 'kind' })).toBe(true);
    expect(commandItemInScope(run, [duration], { scope: 'kind' })).toBe(true);
    expect(commandItemInScope(squat, [duration])).toBe(false);
    expect(commandItemInScope(hold, [{ mode: 'delta', value: 100, variable: 'distanceMeters' }])).toBe(false);
  });
});

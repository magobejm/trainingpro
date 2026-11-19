/**
 * Pure rules of the progression command center.
 * A rule is always applied to each week's own value, so a +5% on week 2 and on week 6
 * starts from what each of those weeks currently prescribes.
 */

export const COMMAND_VARIABLES = [
  'sets',
  'weightKg',
  'reps',
  'rpe',
  'rir',
  'restSeconds',
  'durationSeconds',
  'distanceMeters',
  'fcMaxPct',
  'heartRate',
] as const;
/** Variables of strength sets. The rest belong to cardio and isometric blocks. */
export const STRENGTH_VARIABLES = ['weightKg', 'reps', 'rpe', 'rir', 'restSeconds'] as const;
export const TIMED_VARIABLES = ['durationSeconds', 'distanceMeters', 'fcMaxPct', 'heartRate'] as const;
export const MAX_COMMAND_VARIABLES = 6;

export type CommandVariable = (typeof COMMAND_VARIABLES)[number];
export type CommandMode = 'delta' | 'percent' | 'set';

export type CommandRule = { mode: CommandMode; value: number; variable: CommandVariable };

export type CommandWarning = 'emptyDelta' | 'zeroPercent';

export type CommandSetValues = {
  reps: null | number;
  restSeconds: null | number;
  rir: null | number;
  rpe: null | number;
  weightKg: null | number;
};

export type CommandSetResult = { after: CommandSetValues; warnings: CommandWarning[] };

type ValueVariable = Exclude<CommandVariable, 'sets'>;
type StrengthVariable = (typeof STRENGTH_VARIABLES)[number];
type TimedVariable = (typeof TIMED_VARIABLES)[number];

export type CommandTimedValues = Record<TimedVariable, null | number>;
export type CommandTimedPreview = { after: CommandTimedValues; before: CommandTimedValues; warnings: CommandWarning[] };

const LIMITS: Record<ValueVariable, { decimals: number; max: number }> = {
  reps: { decimals: 0, max: 1000 },
  restSeconds: { decimals: 0, max: 86_400 },
  rir: { decimals: 0, max: 20 },
  rpe: { decimals: 1, max: 10 },
  weightKg: { decimals: 2, max: 2000 },
  durationSeconds: { decimals: 0, max: 86_400 },
  distanceMeters: { decimals: 0, max: 1_000_000 },
  fcMaxPct: { decimals: 0, max: 100 },
  heartRate: { decimals: 0, max: 250 },
};

export function isStrengthVariable(variable: CommandVariable): variable is StrengthVariable {
  return (STRENGTH_VARIABLES as readonly string[]).includes(variable);
}

export function isTimedVariable(variable: CommandVariable): variable is TimedVariable {
  return (TIMED_VARIABLES as readonly string[]).includes(variable);
}

export function isValueVariable(variable: CommandVariable): variable is ValueVariable {
  return variable !== 'sets';
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function clamp(variable: ValueVariable, value: number): number {
  const { decimals, max } = LIMITS[variable];
  return Math.min(max, Math.max(0, round(value, decimals)));
}

/** Applies one rule to one value. Empty values stay empty on relative rules; 0 stays 0 on percent rules. */
export function applyCommandRule(
  variable: ValueVariable,
  current: null | number,
  rule: Pick<CommandRule, 'mode' | 'value'>,
): { value: null | number; warning?: CommandWarning } {
  if (rule.mode === 'set') return { value: clamp(variable, rule.value) };
  if (current == null) return { value: null, warning: 'emptyDelta' };
  if (rule.mode === 'delta') return { value: clamp(variable, current + rule.value) };
  if (current === 0) return { value: 0, warning: 'zeroPercent' };
  return { value: clamp(variable, current * (1 + rule.value / 100)) };
}

/** All value rules on one set. Rules about the number of sets are handled by `applyCommandSetCount`. */
export function applyCommandRulesToSet(set: CommandSetValues, rules: CommandRule[]): CommandSetResult {
  const after = { ...set };
  const warnings: CommandWarning[] = [];
  for (const rule of rules) {
    if (!isStrengthVariable(rule.variable)) continue;
    const result = applyCommandRule(rule.variable, after[rule.variable], rule);
    after[rule.variable] = result.value;
    if (result.warning && !warnings.includes(result.warning)) warnings.push(result.warning);
  }
  return { after, warnings };
}

/** New number of sets for an exercise. Never below one. */
export function applyCommandSetCount(count: number, rules: CommandRule[]): number {
  let next = count;
  for (const rule of rules) {
    if (rule.variable !== 'sets') continue;
    next =
      rule.mode === 'set'
        ? Math.round(rule.value)
        : next + Math.round(rule.mode === 'percent' ? (next * rule.value) / 100 : rule.value);
  }
  return Math.min(30, Math.max(1, next));
}

/** Cardio and isometric sets: only duration, distance and heart-rate rules apply, and the number of sets never changes. */
export function previewCommandTimedSets(sets: CommandTimedValues[], rules: CommandRule[]): CommandTimedPreview[] {
  return sets.map((before) => {
    const after = { ...before };
    const warnings: CommandWarning[] = [];
    for (const rule of rules) {
      if (!isTimedVariable(rule.variable)) continue;
      const result = applyCommandRule(rule.variable, after[rule.variable], rule);
      after[rule.variable] = result.value;
      if (result.warning && !warnings.includes(result.warning)) warnings.push(result.warning);
    }
    return { after, before, warnings };
  });
}

export type CommandPreviewSet = {
  after: CommandSetValues;
  before: CommandSetValues;
  warnings: CommandWarning[];
};

/** What the exercise will look like. Added sets copy the last one, removed sets are taken from the end. */
export function previewCommandExercise(sets: CommandSetValues[], rules: CommandRule[]): CommandPreviewSet[] {
  const count = applyCommandSetCount(sets.length, rules);
  const filled = Array.from({ length: count }, (_, index) => sets[Math.min(index, sets.length - 1)]!);
  return filled.map((before) => ({ before, ...applyCommandRulesToSet(before, rules) }));
}

/** Rules that matter: variables outside the catalog or over the limit of six are dropped. */
export function normalizeCommandRules(rules: CommandRule[]): CommandRule[] {
  const seen = new Set<CommandVariable>();
  const kept: CommandRule[] = [];
  for (const rule of rules) {
    if (!COMMAND_VARIABLES.includes(rule.variable) || !Number.isFinite(rule.value)) continue;
    if (seen.has(rule.variable)) continue;
    if (seen.size >= MAX_COMMAND_VARIABLES) break;
    seen.add(rule.variable);
    kept.push(rule);
  }
  return kept;
}

/**
 * Weeks that come after the selection. When there are none, or every one of them is already selected,
 * there is nothing to ask the coach about.
 */
export function cascadeCandidates(selected: number[], editable: number[]): { later: number[]; shouldAsk: boolean } {
  if (selected.length === 0) return { later: [], shouldAsk: false };
  const last = Math.max(...selected);
  const later = editable.filter((index) => index > last && !selected.includes(index)).sort((a, b) => a - b);
  return { later, shouldAsk: later.length > 0 };
}

/** Strength exercises, or the timed blocks the command can edit. */
export type CommandTargetKind = 'cardio' | 'exercise' | 'isometric';

/** One item, matched across weeks by day, kind, name and position. Ids differ on every week. */
export type CommandItemRef = {
  dayIndex: number;
  displayName: string;
  kind: CommandTargetKind;
  sortOrder: number;
};

/**
 * One chosen item. Omit `setIndexes` to change every set. Later weeks match day, kind, name and position.
 * The set-count rule ignores `setIndexes` and always rewrites the whole exercise.
 */
export type CommandSelectionItem = CommandItemRef & { setIndexes?: number[] };

/**
 * Where the rules land. `kind` (the default) touches every item that uses the active variables.
 * `selection` names the exercises to change, and optionally which of their sets.
 */
export type CommandApplyTarget = { scope: 'kind' } | { scope: 'selection'; items: CommandSelectionItem[] };

export type CommandApplyRequest = {
  /** Weeks chosen by the coach. The server skips whatever is already locked. */
  weekIds: string[];
  /** Days (by position in the microcycle) to touch; empty means all of them. */
  dayIndexes: number[];
  /** Also apply to every later editable week that was not selected. */
  cascade: boolean;
  rules: CommandRule[];
  /** Omitted means every item of the kinds these variables belong to. */
  target?: CommandApplyTarget;
};

/** Strength rules, including the number of sets. Timed blocks ignore these. */
export function rulesTouchStrength(rules: CommandRule[]): boolean {
  return rules.some((rule) => rule.variable === 'sets' || isStrengthVariable(rule.variable));
}

/** Any duration, distance or heart-rate rule. Isometric blocks only keep duration. */
export function rulesTouchCardio(rules: CommandRule[]): boolean {
  return rules.some((rule) => isTimedVariable(rule.variable));
}

export function rulesTouchIsometric(rules: CommandRule[]): boolean {
  return rules.some((rule) => rule.variable === 'durationSeconds');
}

function sameItem(item: CommandItemRef, target: CommandItemRef): boolean {
  return (
    item.dayIndex === target.dayIndex &&
    item.kind === target.kind &&
    item.displayName === target.displayName &&
    item.sortOrder === target.sortOrder
  );
}

function kindUsesRules(kind: CommandTargetKind, rules: CommandRule[]): boolean {
  if (kind === 'exercise') return rulesTouchStrength(rules);
  if (kind === 'cardio') return rulesTouchCardio(rules);
  return rulesTouchIsometric(rules);
}

function withoutSetIndexes(choice: CommandSelectionItem): CommandSelectionItem {
  return { dayIndex: choice.dayIndex, displayName: choice.displayName, kind: choice.kind, sortOrder: choice.sortOrder };
}

/** The chosen item, or every matching kind when no list was sent. A set-count rule widens a partial list. */
export function commandChoice(
  item: CommandItemRef,
  rules: CommandRule[],
  target?: CommandApplyTarget,
): CommandSelectionItem | undefined {
  if (!kindUsesRules(item.kind, rules)) return undefined;
  const found =
    !target || target.scope === 'kind' ? withoutSetIndexes(item) : target.items.find((choice) => sameItem(item, choice));
  if (!found) return undefined;
  return rules.some((rule) => rule.variable === 'sets') ? withoutSetIndexes(found) : found;
}

/** Whether this exercise or block is part of the command. A missing target means every matching kind. */
export function commandItemInScope(item: CommandItemRef, rules: CommandRule[], target?: CommandApplyTarget): boolean {
  return commandChoice(item, rules, target) != null;
}

/** A listed set index leaves the other sets alone. Anything else rewrites every set of the item. */
export function commandTouchesSet(choice: { setIndexes?: number[] } | undefined, index: number): boolean {
  return choice?.setIndexes == null || choice.setIndexes.includes(index);
}

/** Changing how many sets exist needs the whole exercise. A partial list only edits those sets' values. */
export function rulesForChoice(rules: CommandRule[], choice?: { setIndexes?: number[] }): CommandRule[] {
  if (!choice?.setIndexes) return rules;
  return rules.filter((rule) => rule.variable !== 'sets');
}

function currentItems(target: CommandApplyTarget | undefined, visible: CommandItemRef[]): CommandSelectionItem[] {
  if (!target || target.scope === 'kind') return visible.map((item) => withoutSetIndexes(item));
  return target.items;
}

function asTarget(items: CommandSelectionItem[], visible: CommandItemRef[]): CommandApplyTarget {
  const extras = items.some((choice) => !visible.some((item) => sameItem(item, choice)));
  const complete =
    visible.length > 0 &&
    visible.every((item) => items.some((choice) => sameItem(choice, item) && choice.setIndexes == null));
  if (complete && !extras) return { scope: 'kind' };
  return { scope: 'selection', items };
}

/** Check or uncheck one exercise. A partial exercise becomes every set; a full one drops out. */
export function toggleCommandExercise(
  target: CommandApplyTarget | undefined,
  item: CommandItemRef,
  visible: CommandItemRef[],
): CommandApplyTarget {
  const items = currentItems(target, visible);
  const found = items.find((choice) => sameItem(choice, item));
  const rest = items.filter((choice) => !sameItem(choice, item));
  return asTarget(found?.setIndexes == null && found != null ? rest : [...rest, withoutSetIndexes(item)], visible);
}

/** Check or uncheck one set. The last checked set keeps the exercise; clearing them all removes it. */
export function toggleCommandSet(
  target: CommandApplyTarget | undefined,
  item: CommandItemRef,
  setIndex: number,
  setCount: number,
  visible: CommandItemRef[],
): CommandApplyTarget {
  const items = currentItems(target, visible);
  const found = items.find((choice) => sameItem(choice, item));
  const rest = items.filter((choice) => !sameItem(choice, item));
  const all = Array.from({ length: setCount }, (_, index) => index);
  const selected = new Set(found ? (found.setIndexes ?? all) : []);
  if (selected.has(setIndex)) selected.delete(setIndex);
  else selected.add(setIndex);
  const setIndexes = [...selected].sort((left, right) => left - right);
  if (setIndexes.length === 0) return asTarget(rest, visible);
  const choice = setIndexes.length === setCount ? withoutSetIndexes(item) : { ...withoutSetIndexes(item), setIndexes };
  return asTarget([...rest, choice], visible);
}

/** The master checkbox: everything on, or nothing. */
export function toggleCommandAll(target: CommandApplyTarget | undefined): CommandApplyTarget {
  if (!target || target.scope === 'kind') return { scope: 'selection', items: [] };
  return { scope: 'kind' };
}

/** A set-count rule applies to each marked exercise, so a partial set list opens up to every set. */
export function commandTargetForRules(
  target: CommandApplyTarget,
  rules: CommandRule[],
  visible: CommandItemRef[],
): CommandApplyTarget {
  if (target.scope !== 'selection' || !rules.some((rule) => rule.variable === 'sets')) return target;
  return asTarget(
    target.items.map((choice) => withoutSetIndexes(choice)),
    visible,
  );
}

export type CommandApplyResponse = {
  /** Sets whose prescription changed, plus sets added or removed. */
  changedSets: number;
  skippedLockedDays: number;
  touchedWeeks: number;
  warnings: CommandWarning[];
};

export type CoachPresetItem = { id: string; mode: CommandMode; value: number; variable: CommandVariable };

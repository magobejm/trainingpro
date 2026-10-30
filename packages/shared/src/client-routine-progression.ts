/**
 * Pure rules of the progression command center.
 * A rule is always applied to each week's own value, so a +5% on week 2 and on week 6
 * starts from what each of those weeks currently prescribes.
 */

export const COMMAND_VARIABLES = ['sets', 'weightKg', 'reps', 'rpe', 'rir', 'restSeconds'] as const;
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

const LIMITS: Record<ValueVariable, { decimals: number; max: number }> = {
  reps: { decimals: 0, max: 1000 },
  restSeconds: { decimals: 0, max: 86_400 },
  rir: { decimals: 0, max: 20 },
  rpe: { decimals: 1, max: 10 },
  weightKg: { decimals: 2, max: 2000 },
};

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
    if (!isValueVariable(rule.variable)) continue;
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

export type CommandApplyRequest = {
  /** Weeks chosen by the coach. The server skips whatever is already locked. */
  weekIds: string[];
  /** Days (by position in the microcycle) to touch; empty means all of them. */
  dayIndexes: number[];
  /** Also apply to every later editable week that was not selected. */
  cascade: boolean;
  rules: CommandRule[];
};

export type CommandApplyResponse = {
  /** Sets whose prescription changed, plus sets added or removed. */
  changedSets: number;
  skippedLockedDays: number;
  touchedWeeks: number;
  warnings: CommandWarning[];
};

export type CoachPresetItem = { id: string; mode: CommandMode; value: number; variable: CommandVariable };

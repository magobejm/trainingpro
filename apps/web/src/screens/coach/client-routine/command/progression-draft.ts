import {
  COMMAND_VARIABLES,
  MAX_COMMAND_VARIABLES,
  type CommandMode,
  type CommandRule,
  type CommandVariable,
} from '@trainerpro/shared';

export type RuleDraft = { enabled: boolean; mode: CommandMode; text: string };
export type Drafts = Record<CommandVariable, RuleDraft>;

export const MODES: CommandMode[] = ['delta', 'percent', 'set'];

export function emptyDrafts(): Drafts {
  return Object.fromEntries(
    COMMAND_VARIABLES.map((variable) => [variable, { enabled: false, mode: 'delta', text: '' }]),
  ) as Drafts;
}

export function parseValue(text: string): null | number {
  const clean = text.trim().replace(',', '.');
  if (clean === '' || clean === '-' || clean === '+') return null;
  const value = Number(clean);
  return Number.isFinite(value) ? value : null;
}

/** Only the variables that are switched on and have a usable number become rules. */
export function draftRules(drafts: Drafts): CommandRule[] {
  return COMMAND_VARIABLES.flatMap((variable) => {
    const draft = drafts[variable];
    const value = parseValue(draft.text);
    return draft.enabled && value != null ? [{ mode: draft.mode, value, variable }] : [];
  });
}

export function enabledCount(drafts: Drafts): number {
  return COMMAND_VARIABLES.filter((variable) => drafts[variable].enabled).length;
}

export function canEnable(drafts: Drafts, variable: CommandVariable): boolean {
  return drafts[variable].enabled || enabledCount(drafts) < MAX_COMMAND_VARIABLES;
}

/** The number of sets only makes sense as a whole-number change or an absolute count. */
export function modesFor(variable: CommandVariable): CommandMode[] {
  return variable === 'sets' ? ['delta', 'set'] : MODES;
}

export function isDirty(drafts: Drafts): boolean {
  return COMMAND_VARIABLES.some((variable) => drafts[variable].enabled || drafts[variable].text !== '');
}

export function toggleIn<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

import { setVariablesForType, MAX_ACTIVE_SET_VARIABLES, type ExerciseBlockType } from './exercise-set-variables';

export const MAX_CLOCK_SECONDS = 24 * 60 * 60;

export type ClockUnit = 'h' | 'min' | 's';

export type ClockPart = { unit: ClockUnit; value: number };

export function clockParts(totalSeconds: number): ClockPart[] {
  const total = Math.max(0, Math.min(MAX_CLOCK_SECONDS, Math.round(totalSeconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return [
      { unit: 'h', value: hours },
      { unit: 'min', value: minutes },
      { unit: 's', value: seconds },
    ];
  }
  if (minutes > 0) {
    return [
      { unit: 'min', value: minutes },
      { unit: 's', value: seconds },
    ];
  }
  return [{ unit: 's', value: seconds }];
}

export function formatClock(totalSeconds: number): string {
  return clockParts(totalSeconds)
    .map((part) => `${part.value} ${part.unit}`)
    .join(' ');
}

export function carryClock(hours: number, minutes: number, seconds: number): number {
  const safeHours = Math.max(0, Math.trunc(hours));
  const safeMinutes = Math.max(0, Math.trunc(minutes));
  const safeSeconds = Math.max(0, Math.trunc(seconds));
  const extraMinutes = Math.floor(safeSeconds / 60);
  const nextSeconds = safeSeconds % 60;
  const extraHours = Math.floor((safeMinutes + extraMinutes) / 60);
  const nextMinutes = (safeMinutes + extraMinutes) % 60;
  const nextHours = safeHours + extraHours;
  return Math.min(MAX_CLOCK_SECONDS, nextHours * 3600 + nextMinutes * 60 + nextSeconds);
}

const CLOCK_UNITS: ClockUnit[] = ['h', 'min', 's'];

export type ClockDraft = Partial<Record<ClockUnit, string>>;

export type ClockCommit = { kind: 'empty' } | { kind: 'invalid' } | { kind: 'value'; seconds: number };

export function visibleClockUnits(totalSeconds: number | null | undefined): ClockUnit[] {
  if (totalSeconds == null) return ['s'];
  return clockParts(totalSeconds).map((part) => part.unit);
}

export function clockDraftFrom(totalSeconds: number | null | undefined): ClockDraft {
  if (totalSeconds == null) return { s: '' };
  return Object.fromEntries(clockParts(totalSeconds).map((part) => [part.unit, String(part.value)]));
}

/** Hidden units count as zero. A blank field stays empty, and zero stays zero. */
export function commitClockDraft(committedSeconds: number | null | undefined, draft: ClockDraft): ClockCommit {
  const visible = new Set(visibleClockUnits(committedSeconds));
  const typed = CLOCK_UNITS.some((unit) => visible.has(unit) && (draft[unit] ?? '').trim() !== '');
  if (!typed) return { kind: 'empty' };
  const numbers = CLOCK_UNITS.map((unit) => (visible.has(unit) ? Number((draft[unit] ?? '').trim() || '0') : 0));
  if (numbers.some((value) => !Number.isInteger(value) || value < 0)) return { kind: 'invalid' };
  return { kind: 'value', seconds: carryClock(numbers[0] ?? 0, numbers[1] ?? 0, numbers[2] ?? 0) };
}

export function usesMinuteDuration(type: ExerciseBlockType): boolean {
  void type;
  return false;
}

export function toSetDisplayValue(type: ExerciseBlockType, key: string, value: number): number {
  if (key === 'distanceMeters') return value / 1000;
  if (key === 'durationSeconds' && usesMinuteDuration(type)) return Math.round((value / 60) * 1000) / 1000;
  return value;
}

export function fromSetDisplayValue(type: ExerciseBlockType, key: string, value: number): number {
  if (key === 'distanceMeters') return Math.round(value * 1000);
  if (key === 'durationSeconds' && usesMinuteDuration(type)) return Math.round(value * 60);
  return value;
}

const OLD_SPORT_DEFAULT_LOCKS = ['heartRate', 'rir', 'fcReservePct', 'rom', 'restSeconds'];

function sameLocks(fields: string[], expected: string[]): boolean {
  return fields.length === expected.length && expected.every((key) => fields.includes(key));
}

/** Expand the OLD defaults before adding a variable to an existing prescription. */
export function normalizeLegacyLockedFields(type: ExerciseBlockType, fields?: string[]): string[] {
  const locked = fields?.length ? [...fields] : type === 'sport' ? ['heartRate', 'rir', 'fcReservePct', 'rom'] : [];
  if (type === 'cardio' && locked.length === 0) locked.push('durationSeconds');
  if (type === 'sport' && sameLocks(locked, OLD_SPORT_DEFAULT_LOCKS))
    return locked.map((key) => (key === 'restSeconds' ? 'durationSeconds' : key));
  if (type === 'sport') {
    const active = setVariablesForType(type).filter((key) => !locked.includes(key));
    if (active.length > MAX_ACTIVE_SET_VARIABLES && !locked.includes('distanceMeters')) locked.push('distanceMeters');
  }
  return locked;
}

function replacementForStoredLocks(type: unknown, fields: unknown): string[] | undefined {
  if (type === 'cardio' && (!Array.isArray(fields) || fields.length === 0)) return ['durationSeconds'];
  if (type === 'sport' && Array.isArray(fields) && sameLocks(fields, OLD_SPORT_DEFAULT_LOCKS))
    return ['heartRate', 'rir', 'fcReservePct', 'rom', 'durationSeconds'];
  return undefined;
}

function migrateStoredDefaultLocks<T>(content: T): T {
  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      let changed = false;
      const next = value.map((item) => {
        const visited = visit(item);
        if (visited !== item) changed = true;
        return visited;
      });
      return changed ? next : value;
    }
    if (!value || typeof value !== 'object') return value;
    return migrateLockRecord(value as Record<string, unknown>, visit);
  };
  return visit(content) as T;
}

function migrateLockRecord(row: Record<string, unknown>, visit: (value: unknown) => unknown): Record<string, unknown> {
  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    const visited = visit(val);
    next[key] = visited;
    if (visited !== val) changed = true;
  }
  const replacement = replacementForStoredLocks(row.type ?? row.blockType, row.lockedFields);
  if (replacement) {
    next.lockedFields = replacement;
    changed = true;
  }
  for (const [key, kind] of [
    ['cardioBlocks', 'cardio'],
    ['sportBlocks', 'sport'],
  ] as const) {
    if (!Array.isArray(next[key])) continue;
    const blocks = (next[key] as Record<string, unknown>[]).map((block) => replaceBlockLocks(block, kind));
    if (blocks.some((block, index) => block !== (next[key] as unknown[])[index])) {
      next[key] = blocks;
      changed = true;
    }
  }
  return changed ? next : row;
}

function replaceBlockLocks(block: Record<string, unknown>, kind: ExerciseBlockType): Record<string, unknown> {
  const replacement = replacementForStoredLocks(kind, block.lockedFields);
  return replacement ? { ...block, lockedFields: replacement } : block;
}

/** Old immutable revisions are normalized on read; new ones explicitly identify their defaults. */
export function normalizeRoutineSetVariables<T>(content: T): T {
  if (!content || typeof content !== 'object') return content;
  if ((content as Record<string, unknown>).setVariablesVersion === 2) return migrateStoredDefaultLocks(content);
  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== 'object') return value;
    const row = value as Record<string, unknown>;
    const next: Record<string, unknown> = Object.fromEntries(Object.entries(row).map(([key, val]) => [key, visit(val)]));
    const type = row.type ?? row.blockType;
    if (type === 'cardio' || type === 'sport')
      next.lockedFields = normalizeLegacyLockedFields(type, row.lockedFields as string[] | undefined);
    for (const [key, kind] of [
      ['cardioBlocks', 'cardio'],
      ['sportBlocks', 'sport'],
    ] as const) {
      if (Array.isArray(row[key]))
        next[key] = (next[key] as Record<string, unknown>[]).map((block, index) => ({
          ...block,
          lockedFields: normalizeLegacyLockedFields(
            kind,
            (row[key] as Record<string, unknown>[])[index]?.lockedFields as string[] | undefined,
          ),
        }));
    }
    return next;
  };
  return { ...(visit(content) as object), setVariablesVersion: 2 } as T;
}

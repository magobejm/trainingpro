import { z } from 'zod';

type Row = Record<string, unknown>;
export const routineChangeSchema = z.object({
  kind: z.enum(['added', 'removed', 'modified', 'moved']),
  scope: z.enum(['routine', 'day', 'exercise']),
  dayIndex: z.number().nullable(),
  title: z.string(),
  type: z.string().nullable(),
  fields: z.array(z.object({ field: z.string(), before: z.unknown(), after: z.unknown() })),
});
export type RoutineChange = z.infer<typeof routineChangeSchema>;
export const routineComparisonSchema = z.object({
  addedDays: z.number(),
  removedDays: z.number(),
  modifiedDays: z.number(),
  addedExercises: z.number(),
  removedExercises: z.number(),
  modifiedExercises: z.number(),
  changes: z.array(routineChangeSchema),
});
export type RoutineComparison = z.infer<typeof routineComparisonSchema>;
export const routineAssignmentSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  templateId: z.string().uuid(),
  version: z.number().int(),
  appliedAt: z.string(),
  initial: z.boolean(),
  active: z.boolean(),
});
export const routineAssignmentListSchema = z.object({
  items: z.array(routineAssignmentSummarySchema),
  nextCursor: z.string().nullable(),
});
export const routineAssignmentDetailSchema = z.object({
  content: z.record(z.string(), z.unknown()),
  comparison: routineComparisonSchema,
});
export type RoutineAssignmentSummary = z.infer<typeof routineAssignmentSummarySchema>;
const blockKeys = ['exercises', 'cardioBlocks', 'plioBlocks', 'mobilityBlocks', 'isometricBlocks', 'sportBlocks'];
const ignored = new Set([
  'clientWarmups',
  'id',
  'templateId',
  'dayId',
  'blockId',
  'createdBy',
  'updatedBy',
  'createdAt',
  'updatedAt',
  'archivedAt',
  'templateVersion',
  'revisionVersion',
  'isRevision',
  'assignedClients',
  'isAssigned',
  'assignedClientsCount',
  'coachMembershipId',
  'organizationId',
  'scope',
  'clientSaveId',
]);

/** Compare meaning rather than regenerated database identities. */
export function normalizeRoutineContent(value: unknown, key = ''): unknown {
  if (value == null || value === '') return null;
  if (Array.isArray(value)) return value.map((item) => normalizeRoutineContent(item));
  if (typeof value === 'object') {
    const result: Row = {};
    for (const [name, child] of Object.entries(value as Row).sort(([a], [b]) => a.localeCompare(b))) {
      if (ignored.has(name)) continue;
      const normalized = normalizeRoutineContent(child, name);
      if (normalized !== null && !(Array.isArray(normalized) && normalized.length === 0)) result[name] = normalized;
    }
    return result;
  }
  if (
    typeof value === 'string' &&
    /(?:Kg|Rpe|Rir|reps|Seconds|Minutes|Meters|Percent|rounds|setsPlanned)/i.test(key) &&
    /^-?\d+(\.\d+)?$/.test(value)
  )
    return Number(value);
  return typeof value === 'string' ? value.trim() : value;
}

export function compareRoutineContent(before: unknown, after: unknown): RoutineComparison {
  const previous = (normalizeRoutineContent(before) ?? {}) as Row;
  const next = (normalizeRoutineContent(after) ?? {}) as Row;
  const changes: RoutineChange[] = [];
  const oldDays = rows(previous.days),
    newDays = rows(next.days);
  const indices = [...new Set([...oldDays, ...newDays].map((day) => Number(day.dayIndex)))].sort((a, b) => a - b);
  const metadata = diffFields(without(previous, ['days']), without(next, ['days']));
  if (metadata.length)
    changes.push({
      kind: !before ? 'added' : !after ? 'removed' : 'modified',
      scope: 'routine',
      dayIndex: null,
      title: String(next.name ?? ''),
      type: null,
      fields: metadata,
    });
  for (const dayIndex of indices) {
    const oldDay = oldDays.find((day) => Number(day.dayIndex) === dayIndex);
    const newDay = newDays.find((day) => Number(day.dayIndex) === dayIndex);
    if (!oldDay || !newDay) {
      changes.push({
        kind: oldDay ? 'removed' : 'added',
        scope: 'day',
        dayIndex,
        title: String((newDay ?? oldDay)?.title ?? ''),
        type: null,
        fields: diffFields(without(oldDay ?? {}, blockKeys), without(newDay ?? {}, blockKeys)),
      });
    } else {
      const fields = diffFields(without(oldDay, blockKeys), without(newDay, blockKeys));
      if (fields.length)
        changes.push({ kind: 'modified', scope: 'day', dayIndex, title: String(newDay.title), type: null, fields });
    }
    for (const type of blockKeys) compareBlocks(rows(oldDay?.[type]), rows(newDay?.[type]), type, dayIndex, changes);
  }
  const count = (scope: string, kind: string) =>
    changes.filter((change) => change.scope === scope && change.kind === kind).length;
  return {
    addedDays: count('day', 'added'),
    removedDays: count('day', 'removed'),
    modifiedDays: count('day', 'modified'),
    addedExercises: count('exercise', 'added'),
    removedExercises: count('exercise', 'removed'),
    modifiedExercises: changes.filter((change) => change.scope === 'exercise' && ['modified', 'moved'].includes(change.kind))
      .length,
    changes,
  };
}

function compareBlocks(before: Row[], after: Row[], type: string, dayIndex: number, changes: RoutineChange[]) {
  const keyed = (items: Row[]) => {
    const occurrences = new Map<string, number>();
    return new Map(
      items.map((item) => {
        const library = Object.entries(item).find(([key]) => key.endsWith('LibraryId'))?.[1];
        const identity = String(library ?? item.displayName ?? '')
          .trim()
          .toLocaleLowerCase('en');
        const occurrence = occurrences.get(identity) ?? 0;
        occurrences.set(identity, occurrence + 1);
        return [`${identity}:${occurrence}`, item] as const;
      }),
    );
  };
  const old = keyed(before),
    next = keyed(after);
  for (const key of new Set([...old.keys(), ...next.keys()])) {
    const a = old.get(key),
      b = next.get(key);
    const fields = diffFields(a ?? {}, b ?? {});
    if (a && b && !fields.length) continue;
    const kind = !a ? 'added' : !b ? 'removed' : fields.every((field) => field.field === 'sortOrder') ? 'moved' : 'modified';
    changes.push({ kind, scope: 'exercise', dayIndex, title: String((b ?? a)?.displayName ?? ''), type, fields });
  }
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}
function without(row: Row, keys: string[]): Row {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !keys.includes(key)));
}
function diffFields(before: Row, after: Row, prefix = ''): RoutineChange['fields'] {
  const fields: RoutineChange['fields'] = [];
  for (const key of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) {
    const a = before[key] ?? null,
      b = after[key] ?? null,
      field = prefix + key;
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    if (a && b && typeof a === 'object' && typeof b === 'object')
      fields.push(...diffFields(a as Row, b as Row, `${field}.`));
    else fields.push({ field, before: a, after: b });
  }
  return fields;
}

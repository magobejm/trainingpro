import {
  setVariablesForType,
  usesMinuteDuration,
  toSetDisplayValue,
  COACH_BLOCK_ARRAYS,
  COACH_BLOCKS,
  type CoachBlockKind,
} from '@trainerpro/shared';
export type PlanRecord = Record<string, unknown>;
export type PlanEntry = { kind: CoachBlockKind; index: number; value: PlanRecord };
export function routineEntries(day: PlanRecord): PlanEntry[] {
  return COACH_BLOCKS.flatMap((kind) =>
    ((day[COACH_BLOCK_ARRAYS[kind]] ?? []) as PlanRecord[]).map((value, index) => ({ kind, index, value })),
  ).sort((a, b) => Number(a.value.sortOrder) - Number(b.value.sortOrder));
}
export function changeRoutineBlock(
  day: PlanRecord,
  kind: CoachBlockKind,
  index: number,
  next: PlanRecord | null,
): PlanRecord {
  const key = COACH_BLOCK_ARRAYS[kind];
  const items = [...((day[key] as PlanRecord[]) ?? [])];
  if (next) items[index] = next;
  else items.splice(index, 1);
  return { ...day, [key]: items };
}
export function reorderRoutineBlock(day: PlanRecord, entry: PlanEntry, direction: number): PlanRecord {
  const entries = routineEntries(day);
  const from = entries.findIndex((e) => e.kind === entry.kind && e.index === entry.index);
  const to = from + direction;
  if (to < 0 || to >= entries.length) return day;
  [entries[from], entries[to]] = [entries[to]!, entries[from]!];
  let result = day;
  entries.forEach((item, i) => {
    result = changeRoutineBlock(result, item!.kind, item!.index, { ...item!.value, sortOrder: i });
  });
  return result;
}
export function freshRoutineDay(title: string): PlanRecord {
  return {
    dayIndex: 1,
    title,
    groups: [],
    warmupTemplateIds: [],
    ...Object.fromEntries(COACH_BLOCKS.map((kind) => [COACH_BLOCK_ARRAYS[kind], []])),
  };
}
export function duplicateRoutineDay(day: PlanRecord): PlanRecord {
  const copy = JSON.parse(JSON.stringify(day)) as PlanRecord;
  delete copy.id;
  for (const kind of COACH_BLOCKS)
    ((copy[COACH_BLOCK_ARRAYS[kind]] as PlanRecord[]) ?? []).forEach((block) => {
      delete block.id;
    });
  return copy;
}

export function moveRoutineBlockToDay(days: PlanRecord[], from: number, to: number, entry: PlanEntry): PlanRecord[] {
  if (from === to || !days[from] || !days[to]) return days;
  const source = days[from]!;
  const target = days[to]!;
  const groups = [...((target.groups as PlanRecord[]) ?? [])];
  const block: PlanRecord = { ...entry.value, id: undefined, sortOrder: routineEntries(target).length };
  const sourceGroup = ((source.groups as PlanRecord[]) ?? []).find(
    (group) => (group.clientId ?? group.id) === block.groupId,
  );
  if (sourceGroup) {
    const groupId = 'moved-' + groups.length + '-' + Date.now();
    groups.push({ ...sourceGroup, id: undefined, clientId: groupId, sortOrder: groups.length });
    block.groupId = groupId;
  } else block.groupId = null;
  const key = COACH_BLOCK_ARRAYS[entry.kind];
  return days.map((day, index) =>
    index === from
      ? changeRoutineBlock(source, entry.kind, entry.index, null)
      : index === to
        ? { ...target, groups, [key]: [...((target[key] as PlanRecord[]) ?? []), block] }
        : day,
  );
}

export function coachDocumentSetLines(
  kind: CoachBlockKind,
  value: PlanRecord,
  t: (key: string) => string,
  supplied?: PlanRecord[],
): string[] {
  const prescribed = supplied ?? (value.sets as PlanRecord[]) ?? [];
  const duration = usesMinuteDuration(kind)
    ? (value.workSeconds ?? (value.durationMinutes == null ? null : Number(value.durationMinutes) * 60))
    : null;
  const count = Math.max(prescribed.length, Number(value.setsPlanned ?? value.roundsPlanned ?? 0), duration == null ? 0 : 1);
  return Array.from({ length: count }, (_, index) => {
    const row = prescribed.find((set) => Number(set.setIndex) === index) ?? prescribed[index] ?? {};
    const set = {
      ...row,
      ...(row.durationSeconds == null && duration != null ? { durationSeconds: duration } : {}),
    } as PlanRecord;
    return (
      t('coachWorkspace.set') +
      ' ' +
      (index + 1) +
      ': ' +
      [...setVariablesForType(kind), 'advancedTechnique', 'note']
        .filter((key) => set[key] != null && set[key] !== '')
        .map(
          (key) =>
            t('coachWorkspace.field.' + (key === 'durationSeconds' && usesMinuteDuration(kind) ? 'durationMinutes' : key)) +
            ' ' +
            String(typeof set[key] === 'number' ? toSetDisplayValue(kind, key, set[key] as number) : set[key]),
        )
        .join(' · ')
    );
  });
}

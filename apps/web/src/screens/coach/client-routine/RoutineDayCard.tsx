import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Button, Card, colors, fontSize, space, useBreakpoint, type BadgeTone } from '@trainerpro/ui';
import type { RoutineEditorDay, RoutineEditorItemKind, RoutineEditorItemMeta } from '@trainerpro/shared';
import { DayGrouping, GroupFrame, type GroupMember, type GroupType, type OnGroup } from './DayGrouping';
import { DayWarmups, type OnWarmups } from './DayWarmups';
import type { WarmupEditActions } from './WarmupExercisesModal';
import type { SetPatch } from './ClientSeriesTable';
import { DropSlot } from './ItemDrag';
import { RoutineItemCard, type CardItem, type CardSelection, type ItemActions } from './RoutineItemCard';
import { isWeekPeriod } from './routine-period';

type Translate = (key: string) => string;
type Ref = { id: string; kind: RoutineEditorItemKind };

const OUTCOME_TONE: Record<string, BadgeTone> = {
  done: 'success',
  in_progress: 'info',
  incomplete: 'warning',
  pending: 'neutral',
  skipped: 'neutral',
};
const FOLD = { closed: '▸', open: '▾' };

export type RoutineDayActions = {
  onAddExercise: (dayId: string) => void;
  onAddSet: (ref: Ref) => void;
  onDuplicate: (ref: Ref) => void;
  onGroup: OnGroup;
  onMeta: (ref: Ref, meta: RoutineEditorItemMeta) => void;
  onDeleteDay: (day: { id: string; title: string }) => void;
  onMove: (ref: Ref, direction: 'down' | 'up') => void;
  onRenameDay: (day: { id: string; title: string }) => void;
  onPlace: (ref: Ref, toIndex: number) => Promise<void>;
  onPatchSet: (ref: Ref, setId: string, patch: SetPatch) => void;
  onRemoveItem: (ref: Ref) => void;
  onRemoveSet: (ref: Ref, setId: string) => void;
  onReplace: (ref: Ref) => void;
  onWarmups: OnWarmups;
  warmup: WarmupEditActions;
};

/** Exercises and blocks share one order in the day. */
function dayItems(day: RoutineEditorDay): Array<CardItem & { sortOrder: number }> {
  const exercises = day.exercises.map((exercise) => ({ ...exercise, kind: 'exercise' as const }));
  return [...exercises, ...day.blocks].sort((a, b) => a.sortOrder - b.sortOrder);
}

function bind(actions: RoutineDayActions, item: CardItem): ItemActions {
  const ref = { id: item.id, kind: item.kind };
  return {
    onAddSet: () => actions.onAddSet(ref),
    onDuplicate: () => actions.onDuplicate(ref),
    onMeta: (meta) => actions.onMeta(ref, meta),
    onMove: (direction) => actions.onMove(ref, direction),
    onPatchSet: (setId, patch) => actions.onPatchSet(ref, setId, patch),
    onRemove: () => actions.onRemoveItem(ref),
    onRemoveSet: (setId) => actions.onRemoveSet(ref, setId),
    onReplace: () => actions.onReplace(ref),
  };
}

function DayHeader(props: {
  count: number;
  cycleDays: number;
  day: RoutineEditorDay;
  onDelete: () => void;
  onRename: () => void;
  onToggle: () => void;
  open: boolean;
  t: Translate;
}) {
  const { day, t } = props;
  const narrow = useBreakpoint() === 'sm';
  const closed = day.outcome && day.outcome !== 'pending';
  const lockKey = closed
    ? 'coach.clientRoutine.lock.day'
    : isWeekPeriod(props.cycleDays)
      ? 'coach.clientRoutine.lock.week'
      : 'coach.clientRoutine.lock.cycle';
  return (
    <View style={[styles.header, narrow && styles.headerNarrow]}>
      <TouchableOpacity onPress={props.onToggle} style={styles.titleBlock}>
        <Text style={styles.title}>{`${props.open ? FOLD.open : FOLD.closed} ${day.title}`}</Text>
        <Text style={styles.dates}>{day.scheduledDates.join(' · ') || t('coach.clientRoutine.unscheduled')}</Text>
      </TouchableOpacity>
      <View style={[styles.badges, narrow && styles.badgesNarrow]}>
        {day.extra ? <Badge label={t('coach.clientRoutine.day.own')} tone="info" /> : null}
        {day.extra && day.editable ? (
          <>
            <Button label={t('coach.clientRoutine.day.rename.open')} onPress={props.onRename} size="sm" variant="ghost" />
            <Button label={t('coach.clientRoutine.day.delete.open')} onPress={props.onDelete} size="sm" variant="ghost" />
          </>
        ) : null}
        <Badge label={`${props.count} ${t('coach.clientRoutine.itemsCount')}`} tone="neutral" />
        <Badge
          label={t(`coach.clientRoutine.outcome.${day.outcome ?? 'pending'}`)}
          tone={OUTCOME_TONE[day.outcome ?? 'pending']}
        />
        {day.editable ? null : <Badge label={t(lockKey)} tone="warning" />}
      </View>
    </View>
  );
}

type ListedItem = CardItem & { sortOrder: number };
type PickState = { members: GroupMember[]; toggle: (member: GroupMember) => void };
type RunMember = { index: number; item: ListedItem };
type ItemRun = { groupId: string | null; key: string; members: RunMember[] };

function groupRuns(items: ListedItem[]): ItemRun[] {
  const runs: ItemRun[] = [];
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (item.groupId && seen.has(item.groupId)) return;
    if (item.groupId) seen.add(item.groupId);
    const members = item.groupId
      ? items.flatMap((candidate, candidateIndex) =>
          candidate.groupId === item.groupId ? [{ index: candidateIndex, item: candidate }] : [],
        )
      : [{ index, item }];
    runs.push({ groupId: item.groupId, key: item.groupId ?? `${item.kind}-${item.id}`, members });
  });
  return runs;
}

function DayItemList(props: {
  actions: RoutineDayActions;
  day: RoutineEditorDay;
  items: ListedItem[];
  onUngroup: (items: GroupMember[]) => void;
  picking: PickState | null;
  t: Translate;
}): React.JSX.Element {
  const { actions, day, t } = props;
  const signature = props.items.map((item) => `${item.kind}:${item.id}`).join('|');
  const [preview, setPreview] = useState<ListedItem[] | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const pending = useRef(false);
  useEffect(() => setPreview(null), [signature]);
  const shown = preview ?? props.items;
  const place = (from: number, to: number) => {
    const moved = shown[from];
    if (pending.current || from === to || !moved) return;
    pending.current = true;
    setPreview(reorder(shown, from, to));
    setOver(null);
    void actions
      .onPlace({ id: moved.id, kind: moved.kind }, to)
      .catch(() => setPreview(null))
      .finally(() => {
        pending.current = false;
      });
  };
  return (
    <>
      {groupRuns(shown).map((run) => (
        <GroupedRun
          actions={actions}
          day={day}
          key={run.key}
          lastIndex={shown.length - 1}
          onDrop={place}
          onOver={setOver}
          onUngroup={props.onUngroup}
          over={over}
          picking={props.picking}
          run={run}
          t={t}
        />
      ))}
    </>
  );
}

function GroupedRun(props: {
  actions: RoutineDayActions;
  day: RoutineEditorDay;
  lastIndex: number;
  onDrop: (from: number, to: number) => void;
  onOver: (index: number | null) => void;
  onUngroup: (items: GroupMember[]) => void;
  over: number | null;
  picking: PickState | null;
  run: ItemRun;
  t: Translate;
}): React.JSX.Element {
  const { day, run, t } = props;
  const cards = run.members.map(({ index, item }) => (
    <ExerciseSlot
      actions={props.actions}
      day={day}
      index={index}
      item={item}
      key={`${item.kind}-${item.id}`}
      lastIndex={props.lastIndex}
      onDrop={props.onDrop}
      onOver={props.onOver}
      over={props.over}
      picking={props.picking}
      t={t}
    />
  ));
  if (!run.groupId) return <>{cards}</>;
  const group = day.groups.find((item) => item.id === run.groupId);
  const members = run.members.map(({ item }) => ({ id: item.id, kind: item.kind }));
  return (
    <GroupFrame
      count={members.length}
      editable={day.editable}
      label={t(`coach.clientRoutine.group.${group?.groupType ?? 'CIRCUIT'}`)}
      onUngroup={() => props.onUngroup(members)}
      t={t}
    >
      {cards}
    </GroupFrame>
  );
}

function ExerciseSlot(props: {
  actions: RoutineDayActions;
  day: RoutineEditorDay;
  index: number;
  item: ListedItem;
  lastIndex: number;
  onDrop: (from: number, to: number) => void;
  onOver: (index: number | null) => void;
  over: number | null;
  picking: PickState | null;
  t: Translate;
}): React.JSX.Element {
  const { day, index, item, picking } = props;
  const member = { id: item.id, kind: item.kind };
  const selected = Boolean(picking?.members.some((picked) => picked.id === member.id && picked.kind === member.kind));
  const selection: CardSelection | null = picking ? { onToggle: () => picking.toggle(member), selected } : null;
  return (
    <DropSlot
      active={props.over === index}
      dayId={day.id}
      editable={day.editable && !picking}
      index={index}
      onDrop={(from) => props.onDrop(from, index)}
      onOver={props.onOver}
    >
      <RoutineItemCard
        actions={bind(props.actions, item)}
        drag={day.editable && !picking ? { dayId: day.id, index, onDragEnd: () => props.onOver(null) } : null}
        editable={day.editable}
        first={index === 0}
        item={item}
        last={index === props.lastIndex}
        selection={selection}
        t={props.t}
      />
    </DropSlot>
  );
}

function reorder<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  if (moved) next.splice(to, 0, moved);
  return next;
}

export function RoutineDayCard(props: {
  actions: RoutineDayActions;
  cycleDays: number;
  day: RoutineEditorDay;
  t: Translate;
}): React.JSX.Element {
  const { actions, day, t } = props;
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<GroupType | null>(null);
  const [picked, setPicked] = useState<GroupMember[]>([]);
  const items = dayItems(day);
  const clearPick = () => {
    setMode(null);
    setPicked([]);
  };
  const togglePick = (member: GroupMember) =>
    setPicked((current) =>
      current.some((item) => item.id === member.id && item.kind === member.kind)
        ? current.filter((item) => item.id !== member.id || item.kind !== member.kind)
        : [...current, member],
    );
  return (
    <Card>
      <View style={styles.body}>
        <DayHeader
          count={items.length}
          cycleDays={props.cycleDays}
          day={day}
          onDelete={() => actions.onDeleteDay({ id: day.id, title: day.title })}
          onRename={() => actions.onRenameDay({ id: day.id, title: day.title })}
          onToggle={() => setOpen(!open)}
          open={open}
          t={t}
        />
        {open ? (
          <>
            <DayWarmups actions={actions.warmup} day={day} editable={day.editable} onChange={actions.onWarmups} t={t} />
            {day.editable ? (
              <DayGrouping
                day={day}
                mode={mode}
                onCancel={clearPick}
                onConfirm={() => {
                  if (!mode || picked.length < 2) return;
                  actions.onGroup(day.id, picked, mode);
                  clearPick();
                }}
                onStart={(type) => {
                  setMode(type);
                  setPicked([]);
                }}
                selectedCount={picked.length}
                t={t}
              />
            ) : null}
            <DayItemList
              actions={actions}
              day={day}
              items={items}
              onUngroup={(items) => actions.onGroup(day.id, items, null)}
              picking={mode ? { members: picked, toggle: togglePick } : null}
              t={t}
            />
            {items.length === 0 ? <Text style={styles.dates}>{t('coach.clientRoutine.emptyDay')}</Text> : null}
            {day.editable ? (
              <Button
                label={t('coach.clientRoutine.addExercise')}
                onPress={() => actions.onAddExercise(day.id)}
                size="sm"
                variant="secondary"
              />
            ) : null}
          </>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexShrink: 1, flexWrap: 'wrap', gap: space.sm, maxWidth: '100%', minWidth: 0 },
  badgesNarrow: { width: '100%' },
  body: { gap: space.md },
  dates: { color: colors.textMuted, fontSize: fontSize.xs },
  header: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'space-between' },
  headerNarrow: { alignItems: 'stretch', flexDirection: 'column' },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  titleBlock: { gap: 2 },
});

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import {
  commandChoice,
  commandItemInScope,
  commandTargetForRules,
  commandTouchesSet,
  previewCommandExercise,
  previewCommandTimedSets,
  rulesForChoice,
  toggleCommandAll,
  toggleCommandExercise,
  toggleCommandSet,
  type CommandApplyTarget,
  type CommandItemRef,
  type CommandRule,
  type CommandSelectionItem,
  type CommandSetValues,
  type CommandTimedValues,
  type RoutineEditorBlock,
  type RoutineEditorExercise,
  type RoutineEditorWeek,
} from '@trainerpro/shared';
import { VariableHint } from '../../components/VariableHint';
import { isWeekPeriod } from '../routine-period';

type Translate = (key: string, options?: Record<string, unknown>) => string;
const FIELDS = ['weightKg', 'reps', 'rpe', 'rir', 'restSeconds'] as const;
const TIMED_FIELDS = ['durationSeconds', 'distanceMeters', 'fcMaxPct', 'heartRate'] as const;
const CHECK = '✓';
const DASH = '–';

function values(set: RoutineEditorExercise['sets'][number]): CommandSetValues {
  return { reps: set.reps, restSeconds: set.restSeconds, rir: set.rir, rpe: set.rpe, weightKg: set.weightKg };
}

function timed(set: RoutineEditorBlock['sets'][number]): CommandTimedValues {
  return {
    distanceMeters: set.distanceMeters,
    durationSeconds: set.durationSeconds,
    fcMaxPct: set.fcMaxPct,
    heartRate: set.heartRate,
  };
}

type Mark = boolean | 'mixed';

function itemMark(choice: CommandSelectionItem | undefined): Mark {
  if (!choice) return false;
  return choice.setIndexes ? 'mixed' : true;
}

function allMark(target: CommandApplyTarget, visible: CommandItemRef[]): Mark {
  if (target.scope === 'kind') return true;
  if (target.items.length === 0) return false;
  const covered = visible.every((item) =>
    target.items.some(
      (choice) =>
        choice.dayIndex === item.dayIndex &&
        choice.kind === item.kind &&
        choice.displayName === item.displayName &&
        choice.sortOrder === item.sortOrder &&
        choice.setIndexes == null,
    ),
  );
  return covered && visible.length > 0 ? true : 'mixed';
}

function MarkBox(props: { on: boolean; sign: string }): React.JSX.Element {
  return (
    <View style={[styles.box, props.on ? styles.boxOn : null]}>
      {props.on ? <Text style={styles.boxText}>{props.sign}</Text> : null}
    </View>
  );
}

function Check(props: { label: string; onPress: () => void; state: Mark }): React.JSX.Element {
  const on = props.state !== false;
  return (
    <Pressable
      accessibilityLabel={props.label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: props.state === 'mixed' ? 'mixed' : props.state }}
      aria-checked={props.state === 'mixed' ? 'mixed' : props.state}
      onPress={props.onPress}
    >
      <MarkBox on={on} sign={props.state === 'mixed' ? DASH : CHECK} />
    </Pressable>
  );
}

function show(value: null | number): string {
  return value == null ? '–' : String(value);
}

function FieldChange(props: {
  after: null | number;
  before: null | number;
  field: (typeof FIELDS)[number] | (typeof TIMED_FIELDS)[number];
  t: Translate;
}): React.JSX.Element {
  const same = props.before === props.after;
  return (
    <View style={styles.field}>
      <VariableHint id={props.field}>
        <Text style={styles.cell}>{props.t(`coach.clientRoutine.var.${props.field}`)}</Text>
      </VariableHint>
      <Text style={styles.cell}>
        <Text style={styles.before}>{show(props.before)}</Text>
        {' → '}
        <Text style={same ? styles.same : styles.after}>{show(props.after)}</Text>
      </Text>
    </View>
  );
}

function visibleItems(week: RoutineEditorWeek, dayIndexes: number[], rules: CommandRule[]): CommandItemRef[] {
  const days = week.days.filter((day) => day.editable && (dayIndexes.length === 0 || dayIndexes.includes(day.dayIndex)));
  const items: CommandItemRef[] = [];
  for (const day of days) {
    for (const exercise of day.exercises) {
      const item: CommandItemRef = {
        dayIndex: day.dayIndex,
        displayName: exercise.displayName,
        kind: 'exercise',
        sortOrder: exercise.sortOrder,
      };
      if (commandItemInScope(item, rules, { scope: 'kind' })) items.push(item);
    }
    for (const block of day.blocks) {
      if ((block.kind !== 'cardio' && block.kind !== 'isometric') || block.sets.length === 0) continue;
      const item: CommandItemRef = {
        dayIndex: day.dayIndex,
        displayName: block.displayName,
        kind: block.kind,
        sortOrder: block.sortOrder,
      };
      if (commandItemInScope(item, rules, { scope: 'kind' })) items.push(item);
    }
  }
  return items;
}

type RowProps = {
  onTarget: (target: CommandApplyTarget) => void;
  rules: CommandRule[];
  t: Translate;
  target: CommandApplyTarget;
  visible: CommandItemRef[];
  whole: boolean;
};

function ExerciseRows(props: RowProps & { exercise: RoutineEditorExercise; item: CommandItemRef }): React.JSX.Element {
  const choice = commandChoice(props.item, props.rules, props.target);
  const projected = rulesForChoice(props.rules, props.whole ? undefined : { setIndexes: [0] });
  const ordered = [...props.exercise.sets].sort((left, right) => left.setIndex - right.setIndex);
  const rows = previewCommandExercise(ordered.map(values), projected);
  const fields = FIELDS.filter((field) => projected.some((rule) => rule.variable === field));
  return (
    <View style={styles.table}>
      {rows.map((row, index) => {
        const active = choice != null && commandTouchesSet(choice, index);
        return (
          <Pressable
            accessibilityLabel={props.t('coach.clientRoutine.command.pickSet', {
              n: index + 1,
              name: props.item.displayName,
            })}
            accessibilityRole={props.whole ? undefined : 'checkbox'}
            accessibilityState={props.whole ? undefined : { checked: active }}
            aria-checked={props.whole ? undefined : active}
            key={`${props.exercise.id}-${index}`}
            onPress={
              props.whole
                ? undefined
                : () => props.onTarget(toggleCommandSet(props.target, props.item, index, ordered.length, props.visible))
            }
            style={[styles.line, active && !props.whole ? styles.lineOn : null]}
          >
            {props.whole ? null : <MarkBox on={active} sign={CHECK} />}
            <Text style={styles.index}>{index + 1}</Text>
            {fields.map((field) => (
              <FieldChange
                after={active ? row.after[field] : row.before[field]}
                before={row.before[field]}
                field={field}
                key={field}
                t={props.t}
              />
            ))}
            {active && row.warnings.includes('zeroPercent') ? (
              <Text style={styles.warning}>{props.t('coach.clientRoutine.command.zeroPercent')}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function ExerciseCard(props: RowProps & { dayIndex: number; exercise: RoutineEditorExercise }): React.JSX.Element | null {
  const item: CommandItemRef = {
    dayIndex: props.dayIndex,
    displayName: props.exercise.displayName,
    kind: 'exercise',
    sortOrder: props.exercise.sortOrder,
  };
  const [open, setOpen] = useState(false);
  if (!commandItemInScope(item, props.rules, { scope: 'kind' })) return null;
  const choice = commandChoice(item, props.rules, props.target);
  const shown = choice ? rulesForChoice(props.rules, choice) : [];
  const ordered = [...props.exercise.sets].sort((left, right) => left.setIndex - right.setIndex);
  const rows = previewCommandExercise(ordered.map(values), shown);
  const touched =
    choice != null &&
    (rows.length !== props.exercise.sets.length ||
      rows.some(
        (row, index) => commandTouchesSet(choice, index) && JSON.stringify(row.before) !== JSON.stringify(row.after),
      ));
  const reveal = open || choice != null;
  return (
    <View style={[styles.item, choice ? styles.itemOn : null]}>
      <View style={styles.head}>
        <Check
          label={props.exercise.displayName}
          onPress={() => props.onTarget(toggleCommandExercise(props.target, item, props.visible))}
          state={itemMark(choice)}
        />
        <Pressable onPress={() => setOpen(!open)} style={styles.headText}>
          <Text style={styles.name}>{props.exercise.displayName}</Text>
          <Text style={touched ? styles.changed : styles.same}>
            {props.t(touched ? 'coach.clientRoutine.command.willChange' : 'coach.clientRoutine.command.noChange')}
          </Text>
        </Pressable>
      </View>
      {reveal ? <ExerciseRows {...props} exercise={props.exercise} item={item} /> : null}
    </View>
  );
}

function BlockCard(props: RowProps & { block: RoutineEditorBlock; dayIndex: number }): React.JSX.Element | null {
  const item: CommandItemRef = {
    dayIndex: props.dayIndex,
    displayName: props.block.displayName,
    kind: props.block.kind === 'isometric' ? 'isometric' : 'cardio',
    sortOrder: props.block.sortOrder,
  };
  const [open, setOpen] = useState(false);
  if (props.block.kind !== 'cardio' && props.block.kind !== 'isometric') return null;
  if (!commandItemInScope(item, props.rules, { scope: 'kind' })) return null;
  const choice = commandChoice(item, props.rules, props.target);
  const projected = rulesForChoice(props.rules, props.whole ? undefined : { setIndexes: [0] });
  const ordered = [...props.block.sets].sort((left, right) => left.setIndex - right.setIndex);
  const rows = previewCommandTimedSets(ordered.map(timed), projected);
  const fields = TIMED_FIELDS.filter(
    (field) =>
      projected.some((rule) => rule.variable === field) && (props.block.kind === 'cardio' || field === 'durationSeconds'),
  );
  if (rows.length === 0) return null;
  return (
    <View style={[styles.item, choice ? styles.itemOn : null]}>
      <View style={styles.head}>
        <Check
          label={props.block.displayName}
          onPress={() => props.onTarget(toggleCommandExercise(props.target, item, props.visible))}
          state={itemMark(choice)}
        />
        <Pressable onPress={() => setOpen(!open)} style={styles.headText}>
          <Text style={styles.name}>{props.block.displayName}</Text>
        </Pressable>
      </View>
      {open || choice != null ? (
        <View style={styles.table}>
          {rows.map((row, index) => {
            const active = choice != null && commandTouchesSet(choice, index);
            return (
              <Pressable
                accessibilityLabel={props.t('coach.clientRoutine.command.pickSet', {
                  n: index + 1,
                  name: item.displayName,
                })}
                accessibilityRole={props.whole ? undefined : 'checkbox'}
                accessibilityState={props.whole ? undefined : { checked: active }}
                aria-checked={props.whole ? undefined : active}
                key={`${props.block.id}-${index}`}
                onPress={
                  props.whole
                    ? undefined
                    : () => props.onTarget(toggleCommandSet(props.target, item, index, ordered.length, props.visible))
                }
                style={[styles.line, active && !props.whole ? styles.lineOn : null]}
              >
                {props.whole ? null : <MarkBox on={active} sign={CHECK} />}
                <Text style={styles.index}>{index + 1}</Text>
                {fields.map((field) => (
                  <FieldChange
                    after={active ? row.after[field] : row.before[field]}
                    before={row.before[field]}
                    field={field}
                    key={field}
                    t={props.t}
                  />
                ))}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** The first selected week. Checking an item applies that day, name and position on the other weeks too. */
export function ProgressionPreviewPanel(props: {
  cycleDays: number;
  dayIndexes: number[];
  onTarget: (target: CommandApplyTarget) => void;
  rules: CommandRule[];
  t: Translate;
  target: CommandApplyTarget;
  week: RoutineEditorWeek | null;
}): React.JSX.Element {
  const { t, week } = props;
  const weekPeriod = isWeekPeriod(props.cycleDays);
  const visible = week ? visibleItems(week, props.dayIndexes, props.rules) : [];
  const target = commandTargetForRules(props.target, props.rules, visible);
  const whole = props.rules.some((rule) => rule.variable === 'sets');
  const days = week?.days.filter(
    (day) => day.editable && (props.dayIndexes.length === 0 || props.dayIndexes.includes(day.dayIndex)),
  );
  const row: RowProps = { onTarget: props.onTarget, rules: props.rules, t, target, visible, whole };
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{t('coach.clientRoutine.command.preview')}</Text>
      <Text style={styles.hint}>
        {t(weekPeriod ? 'coach.clientRoutine.command.previewHint' : 'coach.clientRoutine.command.previewHintCycle')}
      </Text>
      <Text style={styles.hint}>
        {t(whole ? 'coach.clientRoutine.command.pickHintSets' : 'coach.clientRoutine.command.pickHint')}
      </Text>
      {!week || props.rules.length === 0 ? (
        <Text style={styles.same}>
          {t(weekPeriod ? 'coach.clientRoutine.command.previewEmpty' : 'coach.clientRoutine.command.previewEmptyCycle')}
        </Text>
      ) : (
        <>
          <View style={styles.head}>
            <Check
              label={t('coach.clientRoutine.command.pickAll')}
              onPress={() => props.onTarget(toggleCommandAll(target))}
              state={allMark(target, visible)}
            />
            <Text style={styles.name}>{t('coach.clientRoutine.command.pickAll')}</Text>
          </View>
          {days?.map((day) => (
            <View key={day.id} style={styles.day}>
              <Text style={styles.dayTitle}>
                {day.title ?? t('coach.clientRoutine.command.day', { n: day.dayIndex + 1 })}
              </Text>
              {day.exercises.map((exercise) => (
                <ExerciseCard dayIndex={day.dayIndex} exercise={exercise} key={exercise.id} {...row} />
              ))}
              {day.blocks.map((block) => (
                <BlockCard block={block} dayIndex={day.dayIndex} key={block.id} {...row} />
              ))}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  after: { color: colors.success, fontWeight: '700' },
  before: { color: colors.textMuted },
  box: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxText: { color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: '700', lineHeight: 16 },
  cell: { color: colors.text, fontSize: fontSize.xs },
  changed: { color: colors.success, fontSize: fontSize.xs, fontWeight: '600' },
  day: { gap: space.xs },
  dayTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  field: { alignItems: 'center', flexDirection: 'row', gap: space.xs },
  head: { alignItems: 'center', flexDirection: 'row', gap: space.sm, padding: space.sm },
  headText: { alignItems: 'center', flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  hint: { color: colors.textMuted, fontSize: fontSize.xs },
  index: { color: colors.textMuted, fontSize: fontSize.xs, width: 20 },
  item: { borderColor: colors.border, borderRadius: radius.md, borderWidth: 1 },
  itemOn: { borderColor: colors.primary },
  line: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingVertical: 2 },
  lineOn: { backgroundColor: colors.primarySoft, borderRadius: radius.sm },
  name: { color: colors.text, flex: 1, fontSize: fontSize.sm, fontWeight: '600' },
  panel: { flex: 1, gap: space.sm, minWidth: 280 },
  same: { color: colors.textMuted, fontSize: fontSize.xs },
  table: { gap: space.xs, paddingBottom: space.sm, paddingHorizontal: space.sm },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  warning: { color: colors.warning, fontSize: fontSize.xs, fontWeight: '600' },
});

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import {
  previewCommandExercise,
  previewCommandTimedSets,
  type CommandTimedValues,
  type RoutineEditorBlock,
  type CommandRule,
  type CommandSetValues,
  type RoutineEditorExercise,
  type RoutineEditorWeek,
} from '@trainerpro/shared';

type Translate = (key: string, options?: Record<string, unknown>) => string;
const FIELDS = ['weightKg', 'reps', 'rpe', 'rir', 'restSeconds'] as const;

function values(set: RoutineEditorExercise['sets'][number]): CommandSetValues {
  return { reps: set.reps, restSeconds: set.restSeconds, rir: set.rir, rpe: set.rpe, weightKg: set.weightKg };
}

const TIMED_FIELDS = ['durationSeconds', 'distanceMeters', 'fcMaxPct', 'heartRate'] as const;

function timed(set: RoutineEditorBlock['sets'][number]): CommandTimedValues {
  return {
    distanceMeters: set.distanceMeters,
    durationSeconds: set.durationSeconds,
    fcMaxPct: set.fcMaxPct,
    heartRate: set.heartRate,
  };
}

/** Cardio and isometric blocks: isometric sets only carry a duration, so only that column can change. */
function BlockLines(props: { block: RoutineEditorBlock; rules: CommandRule[]; t: Translate }): React.JSX.Element | null {
  const { block, rules, t } = props;
  const rows = previewCommandTimedSets(block.sets.map(timed), rules);
  const fields = TIMED_FIELDS.filter(
    (field) => rules.some((rule) => rule.variable === field) && (block.kind === 'cardio' || field === 'durationSeconds'),
  );
  if (rows.length === 0 || fields.length === 0) return null;
  return (
    <View style={styles.item}>
      <View style={styles.head}>
        <Text style={styles.name}>{block.displayName}</Text>
      </View>
      <View style={styles.table}>
        {rows.map((row, index) => (
          <View key={`${block.id}-${index}`} style={styles.line}>
            <Text style={styles.index}>{index + 1}</Text>
            {fields.map((field) => (
              <Text key={field} style={styles.cell}>
                {`${t(`coach.clientRoutine.var.${field}`)} `}
                <Text style={styles.before}>{show(row.before[field])}</Text>
                {' → '}
                <Text style={row.before[field] === row.after[field] ? styles.same : styles.after}>
                  {show(row.after[field])}
                </Text>
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function show(value: null | number): string {
  return value == null ? '–' : String(value);
}

function ExerciseAccordion(props: {
  exercise: RoutineEditorExercise;
  rules: CommandRule[];
  t: Translate;
}): React.JSX.Element {
  const { exercise, rules, t } = props;
  const [open, setOpen] = useState(false);
  const rows = previewCommandExercise([...exercise.sets].sort((a, b) => a.setIndex - b.setIndex).map(values), rules);
  const touched = rows.some((row) => JSON.stringify(row.before) !== JSON.stringify(row.after));
  const fields = FIELDS.filter((field) => rules.some((rule) => rule.variable === field));
  return (
    <View style={styles.item}>
      <Pressable accessibilityRole="button" aria-expanded={open} onPress={() => setOpen(!open)} style={styles.head}>
        <Text style={styles.name}>{exercise.displayName}</Text>
        <Text style={touched ? styles.changed : styles.same}>
          {t(touched ? 'coach.clientRoutine.command.willChange' : 'coach.clientRoutine.command.noChange')}
        </Text>
      </Pressable>
      {open ? (
        <View style={styles.table}>
          {rows.map((row, index) => (
            <View key={`${exercise.id}-${index}`} style={styles.line}>
              <Text style={styles.index}>{index + 1}</Text>
              {fields.map((field) => (
                <Text key={field} style={styles.cell}>
                  {`${t(`coach.clientRoutine.var.${field}`)} `}
                  <Text style={styles.before}>{show(row.before[field])}</Text>
                  {' → '}
                  <Text style={row.before[field] === row.after[field] ? styles.same : styles.after}>
                    {show(row.after[field])}
                  </Text>
                </Text>
              ))}
              {row.warnings.includes('zeroPercent') ? (
                <Text style={styles.warning}>{t('coach.clientRoutine.command.zeroPercent')}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** The first selected week with its selected days. Other weeks follow their own values on confirm. */
export function ProgressionPreviewPanel(props: {
  dayIndexes: number[];
  rules: CommandRule[];
  t: Translate;
  week: RoutineEditorWeek | null;
}): React.JSX.Element {
  const { t, week } = props;
  const days = week?.days.filter(
    (day) => day.editable && (props.dayIndexes.length === 0 || props.dayIndexes.includes(day.dayIndex)),
  );
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{t('coach.clientRoutine.command.preview')}</Text>
      <Text style={styles.hint}>{t('coach.clientRoutine.command.previewHint')}</Text>
      {!week || props.rules.length === 0 ? (
        <Text style={styles.same}>{t('coach.clientRoutine.command.previewEmpty')}</Text>
      ) : (
        days?.map((day) => (
          <View key={day.id} style={styles.day}>
            <Text style={styles.dayTitle}>{day.title ?? t('coach.clientRoutine.command.day', { n: day.dayIndex + 1 })}</Text>
            {day.exercises.map((exercise) => (
              <ExerciseAccordion exercise={exercise} key={exercise.id} rules={props.rules} t={t} />
            ))}
            {day.blocks.map((block) => (
              <BlockLines block={block} key={block.id} rules={props.rules} t={t} />
            ))}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  after: { color: colors.success, fontWeight: '700' },
  before: { color: colors.textMuted },
  cell: { color: colors.text, fontSize: fontSize.xs },
  changed: { color: colors.success, fontSize: fontSize.xs, fontWeight: '600' },
  day: { gap: space.xs },
  dayTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  head: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: space.sm },
  hint: { color: colors.textMuted, fontSize: fontSize.xs },
  index: { color: colors.textMuted, fontSize: fontSize.xs, width: 20 },
  item: { borderColor: colors.border, borderRadius: radius.md, borderWidth: 1 },
  line: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  name: { color: colors.text, flex: 1, fontSize: fontSize.sm, fontWeight: '600' },
  panel: { flex: 1, gap: space.sm, minWidth: 280 },
  same: { color: colors.textMuted, fontSize: fontSize.xs },
  table: { gap: space.xs, paddingBottom: space.sm, paddingHorizontal: space.sm },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  warning: { color: colors.warning, fontSize: fontSize.xs, fontWeight: '600' },
});

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import type { RoutineEditorExercise, RoutineEditorSet, RoutineEditorSetPatch } from '@trainerpro/shared';

type Translate = (key: string) => string;
const KEYBOARD = 'decimal-pad' as const;
type Variable = 'reps' | 'restSeconds' | 'rir' | 'rpe' | 'weightKg';

const VARIABLES: Array<{ decimal: boolean; key: Variable; label: string }> = [
  { decimal: true, key: 'weightKg', label: 'coach.clientRoutine.var.weightKg' },
  { decimal: false, key: 'reps', label: 'coach.clientRoutine.var.reps' },
  { decimal: true, key: 'rpe', label: 'coach.clientRoutine.var.rpe' },
  { decimal: false, key: 'rir', label: 'coach.clientRoutine.var.rir' },
  { decimal: false, key: 'restSeconds', label: 'coach.clientRoutine.var.restSeconds' },
];

function show(value: null | number): string {
  return value == null ? '' : String(value);
}

function parse(text: string, decimal: boolean): null | number | undefined {
  const clean = text.trim().replace(',', '.');
  if (clean === '') return null;
  const value = Number(clean);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return decimal ? value : Math.round(value);
}

/** The coach's prescription. Editable only while the day is open; the client's result sits next to it. */
function PrescriptionCell(props: {
  decimal: boolean;
  editable: boolean;
  label: string;
  logged: null | number;
  onCommit: (value: null | number) => void;
  value: null | number;
}): React.JSX.Element {
  const [draft, setDraft] = useState(show(props.value));
  useEffect(() => setDraft(show(props.value)), [props.value]);
  const commit = () => {
    const next = parse(draft, props.decimal);
    if (next === undefined) return setDraft(show(props.value));
    if (next !== props.value) props.onCommit(next);
  };
  return (
    <View style={styles.cell}>
      {props.editable ? (
        <TextInput
          accessibilityLabel={props.label}
          keyboardType={KEYBOARD}
          onBlur={commit}
          onChangeText={setDraft}
          style={styles.input}
          value={draft}
        />
      ) : (
        <Text style={styles.value}>{show(props.value) || ' '}</Text>
      )}
      <Text style={styles.logged}>{props.logged == null ? ' ' : String(props.logged)}</Text>
    </View>
  );
}

function SetRow(props: {
  editable: boolean;
  onPatch: (patch: RoutineEditorSetPatch) => void;
  set: RoutineEditorSet;
  t: Translate;
}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.index}>{props.set.setIndex + 1}</Text>
      {VARIABLES.map((variable) => (
        <PrescriptionCell
          decimal={variable.decimal}
          editable={props.editable}
          key={variable.key}
          label={props.t(variable.label)}
          logged={props.set.logged?.[variable.key] ?? null}
          onCommit={(value) => props.onPatch({ [variable.key]: value })}
          value={props.set[variable.key]}
        />
      ))}
    </View>
  );
}

export function RoutineSetGrid(props: {
  editable: boolean;
  exercise: RoutineEditorExercise;
  onPatch: (setId: string, patch: RoutineEditorSetPatch) => void;
  t: Translate;
}): React.JSX.Element {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <Text style={styles.index}>{props.t('coach.clientRoutine.set')}</Text>
        {VARIABLES.map((variable) => (
          <Text key={variable.key} style={styles.head}>
            {props.t(variable.label)}
          </Text>
        ))}
      </View>
      {props.exercise.sets.map((set) => (
        <SetRow
          editable={props.editable}
          key={set.id}
          onPatch={(patch) => props.onPatch(set.id, patch)}
          set={set}
          t={props.t}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { alignItems: 'center', flex: 1, gap: 2, minWidth: 0 },
  grid: { gap: space.xs },
  head: { color: colors.textMuted, flex: 1, fontSize: fontSize.xs, fontWeight: '600', textAlign: 'center' },
  index: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center', width: 44 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    textAlign: 'center',
    width: '100%',
  },
  logged: { color: colors.success, fontSize: fontSize.xs, fontWeight: '600', minHeight: 16 },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: space.sm },
  value: { color: colors.text, fontSize: fontSize.sm, minHeight: 24, paddingVertical: space.xs },
});

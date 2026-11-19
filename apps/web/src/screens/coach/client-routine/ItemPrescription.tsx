import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import type { RoutineEditorItemKind, RoutineEditorItemMeta } from '@trainerpro/shared';

type Translate = (key: string) => string;
const RANGE = /^\d+(\s*-\s*\d+)?$/;
const RANGE_DRAFT = /^\d+(\s*-\s*\d*)?$/;

/** Exercise-level values. Same row, type and alignment as the series counter. */
export function ItemPrescription(props: {
  editable: boolean;
  item: { kind: RoutineEditorItemKind; repsRange: string | null };
  onChange: (meta: RoutineEditorItemMeta) => void;
  t: Translate;
}): React.JSX.Element | null {
  if (fieldFor(props.item.kind) !== 'repsRange') return null;
  return (
    <View style={styles.row}>
      <RangeField
        editable={props.editable}
        label={props.t('coach.routine.block.repsRange')}
        onCommit={(repsRange) => props.onChange({ repsRange })}
        value={props.item.repsRange}
      />
    </View>
  );
}

function fieldFor(kind: RoutineEditorItemKind): 'repsRange' | null {
  if (kind === 'exercise' || kind === 'plio' || kind === 'mobility') return 'repsRange';
  return null;
}

function RangeField(props: {
  editable: boolean;
  label: string;
  onCommit: (value: string | null) => void;
  value: string | null;
}) {
  const [draft, setDraft] = useState(props.value ?? '');
  useEffect(() => setDraft(props.value ?? ''), [props.value]);
  const commit = () => {
    const next = draft.trim();
    if (next === (props.value ?? '')) return;
    if (next && !RANGE.test(next)) {
      setDraft(props.value ?? '');
      return;
    }
    props.onCommit(next || null);
  };
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        editable={props.editable}
        onBlur={commit}
        onChangeText={(value) => (RANGE_DRAFT.test(value.trim()) || value.trim() === '' ? setDraft(value) : undefined)}
        style={styles.value}
        value={draft}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { alignItems: 'center', flexDirection: 'row', gap: space.xs },
  label: { color: colors.textMuted, fontSize: fontSize.xs },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  value: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
    height: 28,
    paddingHorizontal: space.sm,
    width: 72,
    paddingVertical: 0,
    textAlign: 'center',
  },
});

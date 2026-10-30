import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { clockDraftFrom, commitClockDraft, visibleClockUnits } from '@trainerpro/shared';
import { ui } from './CoachUi';

const KEYBOARD_NUMBER = 'number-pad' as const;

export function ClockField(props: {
  label: string;
  onChange: (next: number | null) => void;
  value: number | null | undefined;
}): React.JSX.Element {
  const [draft, setDraft] = useState(() => clockDraftFrom(props.value));
  useEffect(() => setDraft(clockDraftFrom(props.value)), [props.value]);
  const visible = visibleClockUnits(props.value);
  const commit = () => {
    const result = commitClockDraft(props.value, draft);
    if (result.kind === 'empty') {
      props.onChange(null);
      return;
    }
    if (result.kind === 'invalid') {
      setDraft(clockDraftFrom(props.value));
      return;
    }
    props.onChange(result.seconds);
  };
  return (
    <View style={ui.field}>
      <Text style={ui.label}>{props.label}</Text>
      <View style={styles.row}>
        {visible.map((unit) => (
          <View key={unit} style={styles.part}>
            <TextInput
              accessibilityLabel={`${props.label} ${unit}`}
              keyboardType={KEYBOARD_NUMBER}
              onBlur={commit}
              onChangeText={(text) => {
                if (/^\d*$/.test(text)) setDraft((current) => ({ ...current, [unit]: text }));
              }}
              onSubmitEditing={commit}
              style={ui.input}
              value={draft[unit] ?? ''}
            />
            <Text style={ui.label}>{unit}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = {
  row: { flexDirection: 'row' as const, gap: 8 },
  part: { flex: 1, gap: 4 },
};

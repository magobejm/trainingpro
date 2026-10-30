import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { clockDraftFrom, commitClockDraft, visibleClockUnits } from '@trainerpro/shared';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  onChange: (value: number | undefined) => void;
  placeholder: string;
  readOnly: boolean;
  value: number | undefined;
};

const KB_NUMERIC = 'numeric' as const;

export function SeriesTableClockCell(props: Props): React.JSX.Element {
  const visible = visibleClockUnits(props.value);
  const [draft, setDraft] = useState(() => clockDraftFrom(props.value));

  useEffect(() => {
    setDraft(clockDraftFrom(props.value));
  }, [props.value]);

  const commit = () => {
    const result = commitClockDraft(props.value, draft);
    if (result.kind === 'empty') {
      props.onChange(undefined);
      return;
    }
    if (result.kind === 'invalid') {
      setDraft(clockDraftFrom(props.value));
      return;
    }
    props.onChange(result.seconds);
  };

  return (
    <View style={styles.row}>
      {visible.map((unit) => (
        <View key={unit} style={styles.part}>
          <TextInput
            editable={!props.readOnly}
            keyboardType={KB_NUMERIC}
            onBlur={commit}
            onChangeText={(text) => {
              if (!/^\d*$/.test(text)) return;
              setDraft((current) => ({ ...current, [unit]: text }));
            }}
            onSubmitEditing={commit}
            placeholder={props.placeholder}
            placeholderTextColor={colors.borderStrong}
            style={[styles.input, props.readOnly && styles.readOnly]}
            value={draft[unit] ?? ''}
          />
          <Text style={styles.unit}>{unit}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = {
  row: { flexDirection: 'row' as const, gap: space.xs },
  part: { alignItems: 'center' as const, flex: 1, gap: 2 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: fontSize.xs,
    paddingHorizontal: space.xs,
    paddingVertical: space.sm,
    textAlign: 'center' as const,
    width: '100%' as const,
  },
  readOnly: { backgroundColor: colors.surfaceMuted, color: colors.textMuted },
  unit: { color: colors.textMuted, fontSize: fontSize.xs },
};

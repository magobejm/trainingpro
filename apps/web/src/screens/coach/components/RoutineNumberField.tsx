import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const KEYBOARD_NUMERIC = 'numeric' as const;

interface RoutineNumberFieldProps {
  label: string;
  onChange: (v: number | undefined) => void;
  value: number | undefined;
  readOnly?: boolean;
}

export function RoutineNumberField({ label, onChange, value, readOnly = false }: RoutineNumberFieldProps) {
  return (
    <View style={s.numberField}>
      <Text style={s.numberLabel}>{label}</Text>
      <TextInput
        editable={!readOnly}
        keyboardType={KEYBOARD_NUMERIC}
        onChangeText={(v) => {
          const n = parseInt(v, 10);
          onChange(Number.isNaN(n) ? undefined : n);
        }}
        style={[s.numberInput, readOnly && s.readOnlyInput]}
        value={value !== undefined ? String(value) : ''}
      />
    </View>
  );
}

const s = StyleSheet.create({
  numberField: { gap: space.xs, minWidth: 80 },
  numberLabel: { fontSize: fontSize.xs, fontWeight: '500', color: colors.textMuted },
  numberInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: space.sm,
    fontSize: fontSize.sm,
    width: 80,
    textAlign: 'center',
    color: colors.text,
  },
  readOnlyInput: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
  },
});

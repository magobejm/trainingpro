import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const KEYBOARD_NUMERIC = 'numeric' as const;

interface RoutineNumberFieldProps {
  label: string;
  onChange: (v: number | undefined) => void;
  value: number | undefined;
  readOnly?: boolean;
}

export function RoutineNumberField({
  label,
  onChange,
  value,
  readOnly = false,
}: RoutineNumberFieldProps) {
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
  numberField: { gap: 4, minWidth: 80 },
  numberLabel: { fontSize: 11, fontWeight: '500', color: '#64748b' },
  numberInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 6,
    fontSize: 13,
    width: 80,
    textAlign: 'center',
    color: '#1e293b',
  },
  readOnlyInput: {
    backgroundColor: '#f8fafc',
    color: '#64748b',
  },
});

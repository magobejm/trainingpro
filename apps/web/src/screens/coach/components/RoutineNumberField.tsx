import React from 'react';
import { StyleSheet } from 'react-native';
import { TextField } from '@trainerpro/ui';

const KEYBOARD_NUMERIC = 'numeric' as const;

interface RoutineNumberFieldProps {
  label: string;
  onChange: (v: number | undefined) => void;
  value: number | undefined;
  readOnly?: boolean;
}

export function RoutineNumberField({ label, onChange, value, readOnly = false }: RoutineNumberFieldProps) {
  return (
    <TextField
      containerStyle={s.numberField}
      disabled={readOnly}
      keyboardType={KEYBOARD_NUMERIC}
      label={label}
      onChangeText={(v) => {
        const n = parseInt(v, 10);
        onChange(Number.isNaN(n) ? undefined : n);
      }}
      value={value !== undefined ? String(value) : ''}
    />
  );
}

const s = StyleSheet.create({
  numberField: { minWidth: 96, width: 96 },
});

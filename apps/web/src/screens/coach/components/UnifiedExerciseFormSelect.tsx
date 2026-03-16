import React, { CSSProperties } from 'react';
import { View, StyleSheet } from 'react-native';
import { SelectOption, MODAL_THEME } from '../UnifiedExerciseModal.types';

const selectStyle: CSSProperties = {
  backgroundColor: MODAL_THEME.colors.surface,
  border: `1px solid ${MODAL_THEME.colors.border}`,
  borderRadius: `${MODAL_THEME.borderRadius.md}px`,
  boxSizing: 'border-box',
  color: MODAL_THEME.colors.text,
  minHeight: '44px',
  outline: 'none',
  padding: '8px 12px',
  width: '100%',
  fontSize: '14px',
};

interface FormSelectProps {
  options: SelectOption[];
  value?: string | null;
  onSelect: (val: string) => void;
  placeholder?: string;
  onFocus?: () => void;
}

const EMPTY_VAL = '' as const;

export function FormSelect({ options, value, onSelect, placeholder, onFocus }: FormSelectProps) {
  return (
    <View style={styles.pickerContainer}>
      <select value={value || ''} onChange={(e) => onSelect(e.target.value)} onFocus={onFocus} style={selectStyle}>
        {placeholder ? <option value={EMPTY_VAL}>{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    borderRadius: MODAL_THEME.borderRadius.md,
    backgroundColor: MODAL_THEME.colors.surface,
    overflow: 'hidden',
  },
});

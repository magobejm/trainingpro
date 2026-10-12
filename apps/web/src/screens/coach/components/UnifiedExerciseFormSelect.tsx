import React from 'react';
import { Select } from '@trainerpro/ui';
import { SelectOption } from '../UnifiedExerciseModal.types';

interface FormSelectProps {
  options: SelectOption[];
  value?: string | null;
  onSelect: (val: string) => void;
  label?: string;
  placeholder?: string;
  onFocus?: () => void;
}

export function FormSelect({ options, value, onSelect, label, placeholder, onFocus }: FormSelectProps) {
  return (
    <Select
      label={label}
      onChange={(next) => {
        onFocus?.();
        onSelect(next);
      }}
      options={options}
      placeholder={placeholder || undefined}
      value={value || ''}
    />
  );
}

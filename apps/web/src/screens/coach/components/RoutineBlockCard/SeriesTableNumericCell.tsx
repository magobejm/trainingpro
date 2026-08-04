import React, { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import { st } from './SeriesTable.styles';
import {
  formatStoredNumber,
  isAllowedNumericInput,
  numericModeForField,
  parseAndValidateNumericInput,
  type SeriesNumericMode,
} from './seriesTableNumeric.utils';
import type { DraftSet } from '../../RoutinePlanner.types';

const PLACEHOLDER_MUTED = '#cbd5e1';
const KB_NUMERIC = 'numeric' as const;

interface SeriesTableNumericCellProps {
  fieldKey: keyof DraftSet;
  value: number | undefined;
  readOnly: boolean;
  placeholder: string;
  onChange: (value: number | undefined) => void;
}

export function SeriesTableNumericCell({ fieldKey, value, readOnly, placeholder, onChange }: SeriesTableNumericCellProps) {
  const mode = numericModeForField(fieldKey);
  const [rawText, setRawText] = useState(() => formatDisplayValue(value, mode));

  useEffect(() => {
    setRawText(formatDisplayValue(value, mode));
  }, [value, mode]);

  const commit = () => {
    const parsed = parseAndValidateNumericInput(rawText, mode);
    if (parsed === undefined && rawText.trim() !== '') {
      setRawText(formatDisplayValue(value, mode));
      return;
    }
    onChange(parsed);
    setRawText(formatDisplayValue(parsed, mode));
  };

  return (
    <TextInput
      editable={!readOnly}
      keyboardType={KB_NUMERIC}
      onBlur={commit}
      onChangeText={(text) => {
        if (!isAllowedNumericInput(text, mode)) return;
        setRawText(text);
      }}
      onSubmitEditing={commit}
      placeholder={placeholder}
      placeholderTextColor={PLACEHOLDER_MUTED}
      style={[st.cellInput, readOnly && st.cellInputReadOnly]}
      value={rawText}
    />
  );
}

function formatDisplayValue(value: number | undefined, mode: SeriesNumericMode): string {
  if (value === undefined || value === null) return '';
  return formatStoredNumber(value, mode);
}

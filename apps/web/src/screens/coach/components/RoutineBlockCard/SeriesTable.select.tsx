import React from 'react';
import { colors, fontSize, radius } from '@trainerpro/ui';

export function SelectCell({
  options,
  value,
  onChange,
  readOnly,
  selectPlaceholder,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  selectPlaceholder: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (React.createElement as any)(
    'select',
    {
      value: value || '',
      disabled: readOnly,
      onChange: (e: { target: { value: string } }) => {
        if (!readOnly) onChange(e.target.value);
      },
      style: {
        fontSize: fontSize.xs,
        padding: '5px 4px',
        border: `1px solid ${colors.border}`,
        borderRadius: radius.sm,
        backgroundColor: readOnly ? colors.surfaceMuted : colors.surface,
        color: value ? colors.text : colors.textMuted,
        width: '100%',
        cursor: readOnly ? 'default' : 'pointer',
        appearance: 'auto',
      },
    },
    React.createElement('option', { value: '' }, selectPlaceholder),
    ...options.map((opt) => React.createElement('option', { key: opt, value: opt }, opt)),
  );
}

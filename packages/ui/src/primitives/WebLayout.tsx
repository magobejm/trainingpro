import React from 'react';
import { colors, fontFamily, fontSize, radius, space } from '../theme/tokens';
import { Field } from './Field';

type BoxProps = React.HTMLAttributes<HTMLDivElement>;
/** Superficie web para grids y arrastre HTML; conserva los eventos nativos. */
export function WebBox({ onClick, onKeyDown, role, tabIndex, ...props }: BoxProps): React.JSX.Element {
  return (
    <div
      {...props}
      role={role ?? (onClick ? 'button' : undefined)}
      tabIndex={tabIndex ?? (onClick ? 0 : undefined)}
      onClick={onClick}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !event.defaultPrevented &&
          event.target === event.currentTarget &&
          onClick &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    />
  );
}
export function WebText(props: React.HTMLAttributes<HTMLSpanElement>): React.JSX.Element {
  return <span {...props} style={[textStyle, props.style].reduce((result, value) => ({ ...result, ...value }), {})} />;
}
type DateTimeFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'style' | 'type'> & {
  type: 'date' | 'time';
  error?: string | null;
  label: string;
  onChange: (value: string) => void;
  help?: string;
};
export function DateTimeField({ label, help, error, onChange, ...input }: DateTimeFieldProps): React.JSX.Element {
  return (
    <Field label={label} help={help} error={error} required={input.required}>
      <input {...input} aria-label={label} style={inputStyle} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
const textStyle: React.CSSProperties = { fontFamily: fontFamily.sans, color: colors.text, fontSize: fontSize.sm, margin: 0 };
const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 40,
  border: '1px solid ' + colors.borderStrong,
  borderRadius: radius.md,
  padding: space.sm + 'px ' + space.md + 'px',
  fontSize: fontSize.sm,
  fontFamily: fontFamily.sans,
  boxSizing: 'border-box',
  color: colors.text,
  backgroundColor: colors.surface,
};

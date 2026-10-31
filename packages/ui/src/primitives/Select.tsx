import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Platform, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fontSize, radius, space } from '../theme/tokens';
import { Field } from './Field';
import { findSelectLabel, nextSelectValue, resolveFieldBorder, type SelectOption } from './field.logic';

export type { SelectOption } from './field.logic';

export type SelectProps = {
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  error?: null | string;
  help?: string;
  label?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  value: string;
};

const NATIVE_ROLE = 'button' as const;
const LISTBOX = 'listbox' as const;
const OPTION = 'option' as const;

type ListBox = { left: number; top: number; width: number };

/** Drawn on document.body: a list inside the card is covered by the next field and clipped by overflow. */
function WebList(props: SelectProps & { box: ListBox }): React.JSX.Element {
  return (
    <div role={LISTBOX} style={{ ...webListStyle, left: props.box.left, top: props.box.top, width: props.box.width }}>
      {props.options.map((option) => (
        <div
          aria-selected={option.value === props.value}
          key={option.value}
          onMouseDown={(event) => {
            event.preventDefault();
            props.onChange(option.value);
          }}
          role={OPTION}
          style={option.value === props.value ? webOptionOnStyle : webOptionStyle}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
}

function useFloatingBox(open: boolean, anchor: React.RefObject<HTMLButtonElement | null>): ListBox | null {
  const [box, setBox] = useState<ListBox | null>(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect();
      setBox(rect ? { left: rect.left, top: rect.bottom + 4, width: rect.width } : null);
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchor, open]);
  return open ? box : null;
}

/** The browser paints a native <select> popup with its own colors, which hides the labels on dark pages. */
function WebSelect(props: SelectProps & { border: string; onFocus: () => void }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const anchor = React.useRef<HTMLButtonElement>(null);
  const box = useFloatingBox(open, anchor);
  const label = findSelectLabel(props.options, props.value, props.placeholder);
  return (
    <div style={{ width: '100%' }}>
      <button
        aria-expanded={open}
        aria-haspopup={LISTBOX}
        aria-label={props.label ?? props.placeholder}
        disabled={props.disabled}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((current) => !current)}
        onFocus={() => props.onFocus()}
        ref={anchor}
        style={{ ...webButtonStyle, borderColor: props.border }}
        type="button"
      >
        <span>{label}</span>
        <span aria-hidden>{open ? '▴' : '▾'}</span>
      </button>
      {box
        ? createPortal(
            <WebList
              {...props}
              box={box}
              onChange={(value) => {
                props.onChange(value);
                setOpen(false);
              }}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

export function Select(props: SelectProps): React.JSX.Element {
  const [focused, setFocused] = useState(false);
  const border = resolveFieldBorder({ disabled: props.disabled, error: props.error, focused });
  return (
    <Field error={props.error} help={props.help} label={props.label} required={props.required} style={props.containerStyle}>
      {Platform.OS === 'web' ? (
        <WebSelect {...props} border={border} onFocus={() => setFocused(true)} />
      ) : (
        <Pressable
          accessibilityRole={NATIVE_ROLE}
          disabled={props.disabled}
          onPress={() => props.onChange(nextSelectValue(props.options, props.value))}
          style={[styles.native, { borderColor: border }]}
        >
          <Text style={styles.nativeLabel}>{findSelectLabel(props.options, props.value, props.placeholder)}</Text>
        </Pressable>
      )}
    </Field>
  );
}

const webButtonStyle: React.CSSProperties = {
  alignItems: 'center',
  backgroundColor: colors.surface,
  border: '1px solid',
  borderRadius: radius.md,
  color: colors.text,
  cursor: 'pointer',
  display: 'flex',
  fontFamily: 'inherit',
  fontSize: fontSize.sm,
  justifyContent: 'space-between',
  minHeight: 40,
  padding: `${space.sm}px ${space.md}px`,
  width: '100%',
};

const webListStyle: React.CSSProperties = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
  maxHeight: 280,
  overflowY: 'auto',
  position: 'fixed',
  zIndex: 5000,
};

const webOptionStyle: React.CSSProperties = {
  color: colors.text,
  cursor: 'pointer',
  fontSize: fontSize.sm,
  padding: `${space.sm}px ${space.md}px`,
};

const webOptionOnStyle: React.CSSProperties = { ...webOptionStyle, backgroundColor: colors.surfaceMuted, fontWeight: 600 };

const styles = StyleSheet.create({
  native: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  nativeLabel: { color: colors.text, fontSize: fontSize.sm },
});

import React, { useState } from 'react';
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

export function Select(props: SelectProps): React.JSX.Element {
  const [focused, setFocused] = useState(false);
  const border = resolveFieldBorder({ disabled: props.disabled, error: props.error, focused });
  return (
    <Field error={props.error} help={props.help} label={props.label} required={props.required} style={props.containerStyle}>
      {Platform.OS === 'web' ? (
        <select
          aria-label={props.label ?? props.placeholder}
          disabled={props.disabled}
          onBlur={() => setFocused(false)}
          onChange={(event) => props.onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          style={{ ...webSelectStyle, borderColor: border }}
          value={props.value}
        >
          {props.placeholder ? (
            <option disabled style={webOptionStyle} value="">
              {props.placeholder}
            </option>
          ) : null}
          {props.options.map((option) => (
            <option key={option.value} style={webOptionStyle} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

const webSelectStyle: React.CSSProperties = {
  backgroundColor: colors.surface,
  border: '1px solid',
  borderRadius: radius.md,
  color: colors.text,
  fontFamily: 'inherit',
  fontSize: fontSize.sm,
  minHeight: 40,
  padding: `${space.sm}px ${space.md}px`,
  width: '100%',
};

/** The open list is drawn by the browser; without its own colors it can end up dark text on a dark panel. */
const webOptionStyle: React.CSSProperties = { backgroundColor: colors.surface, color: colors.text };

const styles = StyleSheet.create({
  native: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  nativeLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
});

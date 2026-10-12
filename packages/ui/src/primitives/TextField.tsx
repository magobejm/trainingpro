import React, { useState } from 'react';
import { StyleSheet, TextInput, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, fontSize, radius, space } from '../theme/tokens';
import { Field } from './Field';
import { resolveFieldBorder } from './field.logic';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  error?: null | string;
  help?: string;
  label?: string;
  required?: boolean;
};

export function TextField(props: TextFieldProps): React.JSX.Element {
  const { containerStyle, disabled, error, help, label, required, onBlur, onFocus, ...input } = props;
  const [focused, setFocused] = useState(false);
  return (
    <Field error={error} help={help} label={label} required={required} style={containerStyle}>
      <TextInput
        accessibilityLabel={input.accessibilityLabel ?? label ?? input.placeholder}
        editable={!disabled}
        placeholderTextColor={colors.textMuted}
        {...input}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        style={[
          styles.input,
          { borderColor: resolveFieldBorder({ disabled, error, focused }) },
          disabled ? styles.disabled : null,
          input.multiline ? styles.multiline : null,
        ]}
      />
    </Field>
  );
}

const styles = StyleSheet.create({
  disabled: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    minHeight: 40,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
});

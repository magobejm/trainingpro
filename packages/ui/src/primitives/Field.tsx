import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fontSize, space } from '../theme/tokens';

export type FieldProps = {
  children: React.ReactNode;
  /** Mensaje de error: se muestra en rojo junto al campo. */
  error?: null | string;
  /** Texto de ayuda: solo se ve si no hay error. */
  help?: string;
  label?: string;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Field(props: FieldProps): React.JSX.Element {
  return (
    <View style={[styles.root, props.style]}>
      {props.label ? (
        <Text style={styles.label}>
          {props.label}
          {props.required ? <Text style={styles.required}>{' *'}</Text> : null}
        </Text>
      ) : null}
      {props.children}
      {props.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {props.error}
        </Text>
      ) : props.help ? (
        <Text style={styles.help}>{props.help}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  help: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  required: {
    color: colors.danger,
  },
  root: {
    gap: space.xs,
  },
});

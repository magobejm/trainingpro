import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { fontSize, radius, space } from '../theme/tokens';
import { isButtonInactive, resolveButtonTone, type ButtonVariant } from './button.logic';

export type ButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  label: string;
  loading?: boolean;
  onPress: () => void;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: ButtonVariant;
};

type HoverState = { hovered?: boolean; pressed?: boolean };

export function Button(props: ButtonProps): React.JSX.Element {
  const { variant = 'primary', size = 'md' } = props;
  const inactive = isButtonInactive(props);
  const idle = resolveButtonTone(variant);
  return (
    <Pressable
      accessibilityLabel={props.accessibilityLabel ?? props.label}
      accessibilityRole="button"
      aria-busy={Boolean(props.loading)}
      aria-disabled={inactive}
      disabled={inactive}
      onPress={props.onPress}
      style={(state) => {
        const tone = resolveButtonTone(variant, { ...(state as HoverState), disabled: inactive });
        return [
          styles.base,
          size === 'sm' ? styles.small : styles.medium,
          { backgroundColor: tone.background, borderColor: tone.border },
          props.fullWidth ? styles.fullWidth : null,
          inactive ? styles.inactive : null,
          props.style,
        ];
      }}
      testID={props.testID}
    >
      <View style={styles.content}>
        {props.loading ? <ActivityIndicator color={idle.text} size="small" /> : props.icon}
        <Text style={[styles.label, { color: idle.text }, size === 'sm' && styles.labelSmall]}>{props.label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  inactive: {
    opacity: 0.55,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  labelSmall: {
    fontSize: fontSize.xs,
  },
  medium: {
    minHeight: 40,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  small: {
    minHeight: 32,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
});

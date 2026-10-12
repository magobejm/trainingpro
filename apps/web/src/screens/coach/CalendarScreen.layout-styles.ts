import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export function getLayoutStyle1(value1: NativeStyle['padding']): NativeStyle {
  return StyleSheet.create({
    value: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: value1,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderColor: colors.border,
      flexShrink: 0,
    },
  }).value;
}

export const getLayoutStyle2: NativeStyle = StyleSheet.create({
  value: {
    marginRight: space.md,
    backgroundColor: colors.primarySoft,
    padding: space.sm,
    borderRadius: radius.lg,
  },
}).value;

export const getLayoutStyle3: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
}).value;

export const getLayoutStyle4: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
}).value;

export const getLayoutStyle5: NativeStyle = StyleSheet.create({
  value: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
}).value;

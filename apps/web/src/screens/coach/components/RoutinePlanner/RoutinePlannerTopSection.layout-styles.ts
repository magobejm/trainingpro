import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: NativeStyle = StyleSheet.create({
  value: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
}).value;

export const getLayoutStyle2: NativeStyle = StyleSheet.create({
  value: {
    color: colors.primaryHover,
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
}).value;

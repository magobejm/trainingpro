import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { colors as tk, fontSize, space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: NativeStyle = StyleSheet.create({
  value: {
    gap: space.md,
  },
}).value;

export const getLayoutStyle2: NativeStyle = StyleSheet.create({
  value: {
    alignSelf: 'flex-start',
  },
}).value;

export const getLayoutStyle3: NativeStyle = StyleSheet.create({
  value: {
    gap: space.md,
  },
}).value;

export const getLayoutStyle4: NativeStyle = StyleSheet.create({
  value: {
    alignSelf: 'flex-start',
  },
}).value;

export const getLayoutStyle5: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xs,
    color: tk.textMuted,
  },
}).value;

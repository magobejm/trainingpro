import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { colors as tk, fontSize, space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xs,
    color: tk.textMuted,
    marginLeft: space.sm,
  },
}).value;

export const getLayoutStyle2: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.sm,
    color: tk.textMuted,
  },
}).value;

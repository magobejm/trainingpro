import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: NativeStyle = StyleSheet.create({
  value: {
    marginTop: space.md,
  },
}).value;

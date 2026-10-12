import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    gap: space.sm,
  },
}).value;

export const getLayoutStyle2: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
}).value;

export const getLayoutStyle3: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
}).value;

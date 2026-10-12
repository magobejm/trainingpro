import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';

type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: NativeStyle = StyleSheet.create({
  value: {
    flex: 1,
    minWidth: 0,
  },
}).value;

export const getLayoutStyle2: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}).value;

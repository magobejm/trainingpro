import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';

type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
}).value;

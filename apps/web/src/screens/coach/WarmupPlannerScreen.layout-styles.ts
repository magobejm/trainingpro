import type React from 'react';
import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { radius } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  borderRadius: radius.md,
};

export function getLayoutStyle2(
  value1: NativeStyle['backgroundColor'],
  value2: NativeStyle['borderWidth'],
  value3: NativeStyle['borderColor'],
  value4: NativeStyle['borderStyle'],
): NativeStyle {
  return StyleSheet.create({
    value: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      backgroundColor: value1,
      borderRadius: radius.md,
      borderWidth: value2,
      borderColor: value3,
      borderStyle: value4,
    },
  }).value;
}

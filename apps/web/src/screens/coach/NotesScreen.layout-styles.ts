import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { colors, fontSize, space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: NativeStyle = StyleSheet.create({
  value: {
    marginBottom: space.xxxl,
  },
}).value;

export const getLayoutStyle2: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.lg,
  },
}).value;

export const getLayoutStyle3: NativeStyle = StyleSheet.create({
  value: {
    marginRight: space.sm,
  },
}).value;

export const getLayoutStyle4: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
}).value;

export const getLayoutStyle5: NativeStyle = StyleSheet.create({
  value: {
    padding: space.lg,
  },
}).value;

export function getLayoutStyle6(value1: NativeStyle['flexGrow']): NativeStyle {
  return StyleSheet.create({
    value: {
      flexGrow: value1,
    },
  }).value;
}

export const getLayoutStyle7: NativeStyle = StyleSheet.create({
  value: {
    width: '100%',
  },
}).value;

export const getLayoutStyle8: NativeStyle = StyleSheet.create({
  value: {
    marginBottom: space.xxxl,
  },
}).value;

export const getLayoutStyle9: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: space.sm,
  },
}).value;

export const getLayoutStyle10: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
}).value;

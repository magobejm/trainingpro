import type React from 'react';
import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export function getLayoutStyle1(value1: NativeStyle['flexDirection']): NativeStyle {
  return StyleSheet.create({
    value: {
      flexDirection: value1,
      marginHorizontal: -12,
    },
  }).value;
}

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
    flex: 1,
    paddingHorizontal: space.md,
  },
}).value;

export const getLayoutStyle6: NativeStyle = StyleSheet.create({
  value: {
    marginBottom: space.lg,
  },
}).value;

export const getLayoutStyle7: NativeStyle = StyleSheet.create({
  value: {
    maxHeight: 400,
  },
}).value;

export const getLayoutStyle8: NativeStyle = StyleSheet.create({
  value: {
    marginBottom: space.lg,
  },
}).value;

export const getLayoutStyle9: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: space.sm,
  },
}).value;

export const getLayoutStyle10: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
}).value;

export const getLayoutStyle11: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    padding: space.lg,
    alignItems: 'center',
  },
}).value;

export const getLayoutStyle12: NativeStyle = StyleSheet.create({
  value: {
    flex: 1,
  },
}).value;

export const getLayoutStyle13: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: space.xs,
  },
}).value;

export const getLayoutStyle14: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
}).value;

export const getLayoutStyle15: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

export const getLayoutStyle16: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xl,
  },
}).value;

export const getLayoutStyle17: NativeStyle = StyleSheet.create({
  value: {
    width: 8,
    height: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    marginLeft: space.sm,
  },
}).value;

export const getLayoutStyle18: NativeStyle = StyleSheet.create({
  value: {
    flex: 2,
  },
}).value;

export const getLayoutStyle19: NativeStyle = StyleSheet.create({
  value: {
    padding: space.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
}).value;

export const getLayoutStyle20: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
}).value;

export const getLayoutStyle21: NativeStyle = StyleSheet.create({
  value: {
    flex: 1,
    padding: space.lg,
  },
}).value;

export const getLayoutStyle22: NativeStyle = StyleSheet.create({
  value: {
    padding: space.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
}).value;

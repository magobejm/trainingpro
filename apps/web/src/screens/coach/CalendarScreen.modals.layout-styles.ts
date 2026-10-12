import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { colors as tk, fontSize, radius, space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.sm,
    color: tk.textMuted,
    marginBottom: space.md,
  },
}).value;

export const getLayoutStyle2: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.md,
  },
}).value;

export const getLayoutStyle3: NativeStyle = StyleSheet.create({
  value: {
    flex: 1,
  },
}).value;

export const getLayoutStyle4: NativeStyle = StyleSheet.create({
  value: {
    flex: 1,
  },
}).value;

export function getLayoutStyle5(value1: NativeStyle['borderColor'], value2: NativeStyle['backgroundColor']): NativeStyle {
  return StyleSheet.create({
    value: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: space.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: value1,
      backgroundColor: value2,
      marginBottom: space.sm,
    },
  }).value;
}

export const getLayoutStyle6: NativeStyle = StyleSheet.create({
  value: {
    flex: 1,
  },
}).value;

export const getLayoutStyle7: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.xs,
  },
}).value;

export function getLayoutStyle8(value1: NativeStyle['color']): NativeStyle {
  return StyleSheet.create({
    value: {
      fontSize: fontSize.xs,
      fontWeight: 'bold',
      color: value1,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  }).value;
}

export function getLayoutStyle9(value1: NativeStyle['color']): NativeStyle {
  return StyleSheet.create({
    value: {
      fontSize: fontSize.xs,
      color: value1,
      opacity: 0.7,
    },
  }).value;
}

export function getLayoutStyle10(value1: NativeStyle['color']): NativeStyle {
  return StyleSheet.create({
    value: {
      fontSize: fontSize.xs,
      color: value1,
      opacity: 0.7,
    },
  }).value;
}

export function getLayoutStyle11(value1: NativeStyle['color']): NativeStyle {
  return StyleSheet.create({
    value: {
      fontSize: fontSize.sm,
      fontWeight: 'bold',
      color: value1,
    },
  }).value;
}

export function getLayoutStyle12(value1: NativeStyle['color']): NativeStyle {
  return StyleSheet.create({
    value: {
      fontSize: fontSize.sm,
      fontWeight: 'bold',
      color: value1,
    },
  }).value;
}

export function getLayoutStyle13(value1: NativeStyle['color']): NativeStyle {
  return StyleSheet.create({
    value: {
      fontSize: fontSize.sm,
      color: value1,
      opacity: 0.8,
      marginTop: 2,
    },
  }).value;
}

export const getLayoutStyle14: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginLeft: space.sm,
  },
}).value;

export function getLayoutStyle15(value1: NativeStyle['color']): NativeStyle {
  return StyleSheet.create({
    value: {
      fontSize: fontSize.xs,
      color: value1,
      fontWeight: '600',
      marginTop: 2,
    },
  }).value;
}

import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { colors as tk, fontSize, radius, space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: NativeStyle = StyleSheet.create({
  value: {
    marginBottom: space.xl,
  },
}).value;

export const getLayoutStyle2: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
}).value;

export function getLayoutStyle3(value1: NativeStyle['backgroundColor']): NativeStyle {
  return StyleSheet.create({
    value: {
      paddingHorizontal: space.sm,
      paddingVertical: space.xs,
      borderRadius: radius.sm,
      backgroundColor: value1,
    },
  }).value;
}

export function getLayoutStyle4(value1: NativeStyle['color']): NativeStyle {
  return StyleSheet.create({
    value: {
      fontSize: fontSize.xs,
      fontWeight: 'bold',
      color: value1,
    },
  }).value;
}

export const getLayoutStyle5: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}).value;

export const getLayoutStyle6: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xs,
    color: tk.textMuted,
    marginRight: space.md,
  },
}).value;

export const getLayoutStyle7: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: tk.text,
    marginBottom: space.xs,
  },
}).value;

export const getLayoutStyle8: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.sm,
    color: tk.textMuted,
  },
}).value;

export const getLayoutStyle9: NativeStyle = StyleSheet.create({
  value: {
    height: 1,
    backgroundColor: tk.border,
    marginTop: space.lg,
  },
}).value;

export function getLayoutStyle10(color: NativeStyle['color']): NativeStyle {
  return StyleSheet.create({ value: { fontSize: fontSize.xs, color } }).value;
}

export const getLayoutStyle11: NativeStyle = StyleSheet.create({
  value: {
    padding: space.xl,
    borderBottomWidth: 1,
    borderColor: tk.border,
    flexShrink: 0,
  },
}).value;

export const getLayoutStyle12: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.lg,
  },
}).value;

export const getLayoutStyle13: NativeStyle = StyleSheet.create({
  value: {
    marginRight: space.sm,
  },
}).value;

export const getLayoutStyle14: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: tk.text,
  },
}).value;

export const getLayoutStyle15: NativeStyle = StyleSheet.create({
  value: {
    marginBottom: space.lg,
  },
}).value;

export const getLayoutStyle16: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: tk.textMuted,
    marginBottom: space.sm,
  },
}).value;

export const getLayoutStyle17: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: tk.textMuted,
    marginBottom: space.sm,
  },
}).value;

export const getLayoutStyle18: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
}).value;

export function getLayoutStyle19(
  value1: NativeStyle['width'],
  value2: NativeStyle['height'],
  value3: NativeStyle['maxHeight'],
  value4: NativeStyle['borderLeftWidth'],
  value5: NativeStyle['borderTopWidth'],
): NativeStyle {
  return StyleSheet.create({
    value: {
      width: value1,
      height: value2,
      flexShrink: 0,
      alignSelf: 'stretch',
      minHeight: 0,
      maxHeight: value3,
      backgroundColor: 'white',
      borderLeftWidth: value4,
      borderTopWidth: value5,
      borderColor: tk.border,
      flexDirection: 'column',
      overflow: 'hidden',
    },
  }).value;
}

export const getLayoutStyle20: NativeStyle = StyleSheet.create({
  value: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minHeight: 0,
  },
}).value;

export const getLayoutStyle21: NativeStyle = StyleSheet.create({
  value: {
    padding: space.xl,
    paddingBottom: space.sm,
  },
}).value;

export const getLayoutStyle22: NativeStyle = StyleSheet.create({
  value: {
    flexShrink: 0,
    padding: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderColor: tk.border,
    backgroundColor: tk.surface,
    shadowColor: tk.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
}).value;

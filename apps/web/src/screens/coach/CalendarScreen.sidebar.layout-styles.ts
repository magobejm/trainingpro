import { webShadow } from '@trainerpro/ui';
import type React from 'react';
import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { colors as tk, fontSize, radius, space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: NativeStyle = StyleSheet.create({
  value: {
    padding: space.xl,
    borderBottomWidth: 1,
    borderColor: tk.border,
    flexShrink: 0,
  },
}).value;

export const getLayoutStyle2: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.md,
  },
}).value;

export const getLayoutStyle3: NativeStyle = StyleSheet.create({
  value: {
    marginRight: space.sm,
    backgroundColor: tk.primarySoft,
    padding: space.sm,
    borderRadius: radius.md,
  },
}).value;

export const getLayoutStyle4: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: tk.text,
  },
}).value;

export const getLayoutStyle5: NativeStyle = StyleSheet.create({
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: tk.surfaceMuted,
    borderWidth: 1,
    borderColor: tk.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
  },
}).value;

export const getLayoutStyle6: NativeStyle = StyleSheet.create({
  value: {
    flex: 1,
    minWidth: 0,
  },
}).value;

export const getLayoutStyle7: NativeStyle = StyleSheet.create({
  value: {
    marginTop: space.md,
  },
}).value;

export const getLayoutStyle8: NativeStyle = StyleSheet.create({
  value: {
    marginBottom: space.xs,
  },
}).value;

export function getLayoutStyle9(value1: NativeStyle['borderColor'], value2: NativeStyle['backgroundColor']): NativeStyle {
  return StyleSheet.create({
    value: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: space.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: value1,
      backgroundColor: value2,
    },
  }).value;
}

export const getLayoutStyle10: NativeStyle = StyleSheet.create({
  value: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tk.border,
    overflow: 'hidden',
    marginRight: space.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
}).value;

export const getLayoutStyle11: NativeStyle = StyleSheet.create({
  value: {
    width: 40,
    height: 40,
  },
}).value;

export const getLayoutStyle12: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: tk.textMuted,
  },
}).value;

export const getLayoutStyle13: NativeStyle = StyleSheet.create({
  value: {
    flex: 1,
    minWidth: 0,
  },
}).value;

export function getLayoutStyle14(value1: NativeStyle['color']): NativeStyle {
  return StyleSheet.create({
    value: {
      fontSize: fontSize.sm,
      fontWeight: 'bold',
      color: value1,
    },
  }).value;
}

export const getLayoutStyle15: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xs,
    color: tk.textMuted,
  },
}).value;

export const getLayoutStyle16: NativeStyle = StyleSheet.create({
  value: {
    paddingLeft: space.xs,
    paddingRight: space.xs,
    marginTop: space.sm,
  },
}).value;

export const getLayoutStyle17: NativeStyle = StyleSheet.create({
  value: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: tk.textMuted,
    letterSpacing: 0.5,
    marginBottom: space.sm,
    textTransform: 'uppercase',
  },
}).value;

export function getLayoutStyle18(value1: NativeStyle['borderColor'], value2: NativeStyle['backgroundColor']): NativeStyle {
  return StyleSheet.create({
    value: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: space.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: value1,
      backgroundColor: value2,
      marginBottom: space.sm,
    },
  }).value;
}

export function getLayoutStyle19(value1: NativeStyle['backgroundColor']): NativeStyle {
  return StyleSheet.create({
    value: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: value1,
      marginRight: space.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
  }).value;
}

export function getLayoutStyle20(value1: NativeStyle['color']): NativeStyle {
  return StyleSheet.create({
    value: {
      fontSize: fontSize.sm,
      fontWeight: 'bold',
      color: value1,
    },
  }).value;
}

export function getLayoutStyle21(
  value1: NativeStyle['width'],
  value2: NativeStyle['height'],
  value3: NativeStyle['borderRightWidth'],
  value4: NativeStyle['borderBottomWidth'],
): NativeStyle {
  return StyleSheet.create({
    value: {
      width: value1,
      height: value2,
      backgroundColor: tk.surface,
      borderRightWidth: value3,
      borderBottomWidth: value4,
      borderColor: tk.border,
      flexDirection: 'column',
      alignSelf: 'stretch',
      flexShrink: 0,
    },
  }).value;
}

export const getLayoutStyle22: NativeStyle = StyleSheet.create({
  value: {
    flex: 1,
    minHeight: 0,
  },
}).value;

export const getLayoutStyle23: NativeStyle = StyleSheet.create({
  value: {
    padding: space.md,
  },
}).value;

export function getLayoutStyle24(
  value1: React.CSSProperties['border'],
  value2: React.CSSProperties['backgroundColor'],
): React.CSSProperties {
  return {
    position: 'relative',
    padding: '10px 12px',
    borderRadius: radius.md,
    border: value1,
    backgroundColor: value2,
    marginBottom: space.sm,
    cursor: 'grab',
    userSelect: 'none',
  };
}

export const getLayoutStyle25: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

export function getLayoutStyle26(value1: React.CSSProperties['color']): React.CSSProperties {
  return {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: value1,
    margin: 0,
  };
}

export function getLayoutStyle27(value1: React.CSSProperties['color']): React.CSSProperties {
  return {
    fontSize: fontSize.xs,
    color: value1,
    opacity: 0.7,
    margin: '2px 0 0',
  };
}

export const getLayoutStyle28: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 32,
  backgroundColor: tk.surface,
  borderRadius: radius.md,
  padding: space.sm,
  boxShadow: webShadow.md,
  border: `1px solid ${tk.border}`,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: space.sm,
  zIndex: 50,
};

export function getLayoutStyle29(value1: NativeStyle['backgroundColor']): NativeStyle {
  return StyleSheet.create({
    value: {
      backgroundColor: value1,
      width: 16,
      height: 16,
      borderRadius: radius.sm,
      borderWidth: 2,
      borderColor: tk.textMuted,
    },
  }).value;
}

export function getLayoutStyle30(
  value1: NativeStyle['backgroundColor'],
  value2: NativeStyle['borderWidth'],
  value3: NativeStyle['borderColor'],
): NativeStyle {
  return StyleSheet.create({
    value: {
      backgroundColor: value1,
      width: 20,
      height: 20,
      borderRadius: radius.sm,
      borderWidth: value2,
      borderColor: value3,
    },
  }).value;
}

export const routineDayBody: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: space.xs, minWidth: 0 };

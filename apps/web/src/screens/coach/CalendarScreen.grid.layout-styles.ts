import type React from 'react';
import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { colors as tk, fontSize, radius, space } from '@trainerpro/ui';
type NativeStyle = ViewStyle & TextStyle & ImageStyle;
export const getLayoutStyle1: React.CSSProperties = {
  cursor: 'pointer',
  lineHeight: 0,
};

export const getLayoutStyle2: React.CSSProperties = {
  cursor: 'pointer',
  lineHeight: 0,
};

export function getLayoutStyle3(
  value1: React.CSSProperties['backgroundColor'],
  value2: React.CSSProperties['cursor'],
): React.CSSProperties {
  return {
    borderRight: `1px solid ${tk.border}`,
    borderBottom: `1px solid ${tk.border}`,
    minHeight: 110,
    padding: '6px 4px',
    backgroundColor: value1,
    cursor: value2,
    position: 'relative',
    transition: 'background-color 0.1s',
  };
}

export const getLayoutStyle4: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: space.xs,
  marginBottom: 2,
};

export function getLayoutStyle5(value1: React.CSSProperties['backgroundColor']): React.CSSProperties {
  return {
    width: 26,
    height: 26,
    borderRadius: radius.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: value1,
    flexShrink: 0,
  };
}

export function getLayoutStyle6(
  value1: React.CSSProperties['fontWeight'],
  value2: React.CSSProperties['color'],
): React.CSSProperties {
  return {
    fontSize: fontSize.xs,
    fontWeight: value1,
    color: value2,
  };
}

export const getLayoutStyle7: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

export const getLayoutStyle8: React.CSSProperties = {
  fontSize: fontSize.xs,
  color: tk.textMuted,
  paddingLeft: space.xs,
};

export const getLayoutStyle9: NativeStyle = StyleSheet.create({
  value: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: tk.surface,
    minWidth: 0,
  },
}).value;

export const getLayoutStyle10: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  minHeight: 0,
};

export function getLayoutStyle11(
  value1: React.CSSProperties['backgroundColor'],
  value2: React.CSSProperties['color'],
  value3: React.CSSProperties['border'],
  value4: React.CSSProperties['cursor'],
  value5: React.CSSProperties['opacity'],
): React.CSSProperties {
  return {
    backgroundColor: value1,
    color: value2,
    border: value3,
    borderRadius: radius.sm,
    padding: '2px 6px',
    fontSize: fontSize.sm,
    fontWeight: 500,
    overflow: 'hidden',
    maxWidth: '100%',
    cursor: value4,
    opacity: value5,
  };
}

export const getLayoutStyle12: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const getLayoutStyle13: React.CSSProperties = {
  fontSize: fontSize.xs,
  fontWeight: 600,
  whiteSpace: 'normal',
};

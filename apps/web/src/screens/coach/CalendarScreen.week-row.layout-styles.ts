import type React from 'react';
import { colors as tk, space } from '@trainerpro/ui';
export function getLayoutStyle1(value1: React.CSSProperties['backgroundColor']): React.CSSProperties {
  return {
    width: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    cursor: 'grab',
    flexShrink: 0,
    backgroundColor: value1,
    borderRight: `1px solid ${tk.border}`,
  };
}

export const getLayoutStyle2: React.CSSProperties = {
  cursor: 'pointer',
  lineHeight: 0,
};

export const getLayoutStyle3: React.CSSProperties = {
  cursor: 'pointer',
  lineHeight: 0,
};

export function getLayoutStyle4(value1: React.CSSProperties['outline']): React.CSSProperties {
  return {
    display: 'flex',
    outline: value1,
    outlineOffset: '-2px',
    transition: 'outline 0.1s',
  };
}

export const getLayoutStyle5: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  flex: 1,
  minWidth: 0,
};

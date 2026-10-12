import type React from 'react';

import { fontSize } from '@trainerpro/ui';

export const getLayoutStyle1: React.CSSProperties = {
  position: 'relative',
};

export function getLayoutStyle2(color: React.CSSProperties['color']): React.CSSProperties {
  return { color, fontSize: fontSize.md, lineHeight: 1 };
}

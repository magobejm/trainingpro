import React from 'react';
import { View } from 'react-native';
import { colors } from '@trainerpro/ui';

export type EmptyIllustrationKind = 'calendar' | 'clients' | 'generic' | 'library' | 'notes';

type Attrs = Record<string, boolean | number | string>;

function node(type: string, attrs: Attrs, children?: React.ReactNode): React.ReactElement {
  return React.createElement(type, attrs, children);
}

function frame(): React.ReactElement {
  return node('rect', { fill: colors.primarySoft, height: 96, rx: 16, width: 120 });
}

export function EmptyIllustration(props: { kind: EmptyIllustrationKind }): React.JSX.Element {
  return (
    <View accessibilityElementsHidden>
      {node('svg', { 'aria-hidden': true, height: 96, viewBox: '0 0 120 96', width: 120 }, scenes[props.kind]())}
    </View>
  );
}

const scenes: Record<EmptyIllustrationKind, () => React.ReactElement[]> = {
  calendar: () => [
    frame(),
    node('rect', { fill: colors.surface, height: 56, rx: 8, width: 72, x: 24, y: 22 }),
    node('rect', { fill: colors.primary, height: 8, width: 72, x: 24, y: 22 }),
    node('circle', { cx: 40, cy: 48, fill: colors.primary, r: 4 }),
    node('circle', { cx: 56, cy: 48, fill: colors.border, r: 4 }),
    node('circle', { cx: 72, cy: 62, fill: colors.primary, r: 4 }),
  ],
  clients: () => [
    frame(),
    node('circle', { cx: 44, cy: 40, fill: colors.primary, r: 12 }),
    node('circle', { cx: 76, cy: 44, fill: colors.info, r: 10 }),
    node('rect', { fill: colors.surface, height: 16, rx: 8, width: 56, x: 32, y: 62 }),
  ],
  generic: () => [
    frame(),
    node('circle', { cx: 60, cy: 48, fill: colors.surface, r: 22 }),
    node('path', { d: 'M52 48h16M60 40v16', stroke: colors.primary, strokeWidth: 3 }),
  ],
  library: () => [
    frame(),
    node('rect', { fill: colors.surface, height: 48, rx: 6, width: 28, x: 28, y: 24 }),
    node('rect', { fill: colors.primary, height: 48, rx: 6, width: 28, x: 64, y: 24 }),
    node('rect', { fill: colors.surface, height: 8, rx: 2, width: 16, x: 70, y: 36 }),
  ],
  notes: () => [
    frame(),
    node('rect', { fill: colors.surface, height: 58, rx: 8, width: 64, x: 28, y: 20 }),
    node('rect', { fill: colors.border, height: 4, rx: 2, width: 40, x: 38, y: 34 }),
    node('rect', { fill: colors.border, height: 4, rx: 2, width: 32, x: 38, y: 46 }),
    node('rect', { fill: colors.primary, height: 4, rx: 2, width: 24, x: 38, y: 58 }),
  ],
};

import { getLayoutStyle2 } from './WarmupPlannerScreen.layout-styles';

/* eslint-disable max-lines-per-function */
/* eslint-disable max-lines-per-function */
import React from 'react';

import { Text, TouchableOpacity, View } from 'react-native';

import { Button, colors, fontSize, space } from '@trainerpro/ui';

export function SelectionOverlay({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  const layoutStyle2 = getLayoutStyle2(
    selected ? colors.primarySoft : colors.surfaceMuted,
    selected ? 2 : 1,
    selected ? colors.primary : colors.primaryBorder,
    selected ? 'solid' : 'dashed',
  );
  return <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={layoutStyle2} />;
}
interface WarmupGroupModeBarProps {
  groupMode: 'CIRCUIT' | 'SUPERSET' | null;
  selectedCount: number;
  t: (key: string, options?: Record<string, unknown>) => string;
  onStartCircuit: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}
export function WarmupGroupModeBar({
  groupMode,
  selectedCount,
  t,
  onStartCircuit,
  onCancel,
  onConfirm,
}: WarmupGroupModeBarProps) {
  if (!groupMode) {
    return (
      <View style={gbs.bar}>
        <Button label={t('coach.routine.group.addCircuit')} onPress={onStartCircuit} size="sm" variant="secondary" />
      </View>
    );
  }
  return (
    <View style={[gbs.bar, gbs.activeBar]}>
      <Text style={gbs.hint}>
        {t('coach.routine.group.selectHint', { label: t('coach.routine.group.circuit'), count: selectedCount })}
      </Text>
      <View style={gbs.spacer} />
      <Button label={t('coach.routine.delete.cancel')} onPress={onCancel} size="sm" variant="secondary" />
      {selectedCount >= 2 && (
        <Button
          label={t('coach.routine.group.create', { label: t('coach.routine.group.circuit') })}
          onPress={onConfirm}
          size="sm"
        />
      )}
    </View>
  );
}
const gbs = {
  bar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    backgroundColor: colors.surfaceMuted,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  activeBar: { backgroundColor: colors.primarySoft },
  hint: { fontSize: fontSize.xs, color: colors.textMuted },
  spacer: { flex: 1 },
};

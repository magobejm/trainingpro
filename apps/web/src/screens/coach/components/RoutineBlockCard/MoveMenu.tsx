import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

interface MoveMenuProps {
  daysCount: number;
  dayIdx: number;
  dayLabels?: string[];
  onMoveToDay: (idx: number) => void;
  t: (k: string) => string;
}

export function MoveMenu({ daysCount, dayIdx, dayLabels, onMoveToDay, t }: MoveMenuProps) {
  return (
    <View style={[s.blockTypeRow, styles.container]}>
      <Text style={styles.label}>{`${t('coach.routine.moveToDay')}:`}</Text>
      {Array.from({ length: daysCount }).map(
        (_, i) =>
          i !== dayIdx && (
            <Pressable key={i} onPress={() => onMoveToDay(i)} style={[s.moveBtn, { backgroundColor: colors.primary }]}>
              <Text numberOfLines={1} style={[s.moveBtnText, styles.dayLabel]}>
                {dayLabels?.[i] ?? String(i + 1)}
              </Text>
            </Pressable>
          ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: space.xs,
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginRight: space.xs,
  },
  dayLabel: {
    color: colors.surface,
    fontSize: fontSize.xs,
    fontWeight: '600',
    maxWidth: 110,
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import { Button, colors, fontSize, radius, space } from '@trainerpro/ui';

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
            <Button
              key={i}
              label={dayLabels?.[i] ?? String(i + 1)}
              onPress={() => onMoveToDay(i)}
              size="sm"
              style={styles.dayBtn}
            />
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
  dayBtn: {
    maxWidth: 140,
  },
});

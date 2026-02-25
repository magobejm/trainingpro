import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';

interface MoveMenuProps {
  daysCount: number;
  dayIdx: number;
  onMoveToDay: (idx: number) => void;
  t: (k: string) => string;
}

export function MoveMenu({ daysCount, dayIdx, onMoveToDay, t }: MoveMenuProps) {
  return (
    <View style={[s.blockTypeRow, styles.container]}>
      <Text style={styles.label}>{`${t('coach.routine.moveToDay')}:`}</Text>
      {Array.from({ length: daysCount }).map(
        (_, i) =>
          i !== dayIdx && (
            <Pressable
              key={i}
              onPress={() => onMoveToDay(i)}
              style={[s.moveBtn, { backgroundColor: '#3b82f6' }]}
            >
              <Text style={[s.moveBtnText, { color: '#fff' }]}>{i + 1}</Text>
            </Pressable>
          ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    marginRight: 4,
  },
});

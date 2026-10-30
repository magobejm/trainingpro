import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Button, space } from '@trainerpro/ui';
import type { RoutineEditorDay } from '@trainerpro/shared';

type Translate = (key: string) => string;
export type GroupType = 'CIRCUIT' | 'SUPERSET';
export type OnGroup = (dayId: string, exerciseIds: string[], groupType: GroupType | null) => void;

export function groupLabelKey(day: RoutineEditorDay, groupId: null | string): null | string {
  const group = day.groups.find((item) => item.id === groupId);
  return group ? `coach.clientRoutine.group.${group.groupType}` : null;
}

/** Selecting exercises of one day and turning them into a superset or circuit, or taking them out of a group. */
export function DayGrouping(props: { day: RoutineEditorDay; onGroup: OnGroup; t: Translate }): React.JSX.Element | null {
  const { day, onGroup, t } = props;
  const [selected, setSelected] = useState<string[]>([]);
  if (day.exercises.length < 2) return null;
  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const apply = (type: GroupType | null) => {
    onGroup(day.id, selected, type);
    setSelected([]);
  };
  return (
    <View style={styles.row}>
      {day.exercises.map((exercise, index) => {
        const label = groupLabelKey(day, exercise.groupId);
        return (
          <View key={exercise.id} style={styles.item}>
            <Button
              label={`${index + 1}. ${exercise.displayName}`}
              onPress={() => toggle(exercise.id)}
              size="sm"
              variant={selected.includes(exercise.id) ? 'primary' : 'secondary'}
            />
            {label ? <Badge label={t(label)} tone="info" /> : null}
          </View>
        );
      })}
      <Button
        disabled={selected.length < 2}
        label={t('coach.clientRoutine.group.makeSuperset')}
        onPress={() => apply('SUPERSET')}
        size="sm"
      />
      <Button
        disabled={selected.length < 2}
        label={t('coach.clientRoutine.group.makeCircuit')}
        onPress={() => apply('CIRCUIT')}
        size="sm"
      />
      <Button
        disabled={selected.length < 1}
        label={t('coach.clientRoutine.group.ungroup')}
        onPress={() => apply(null)}
        size="sm"
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: 'center', flexDirection: 'row', gap: space.xs },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});

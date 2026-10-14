import { clientPlanDecorations } from '../theme/tokens';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { buildExerciseBlocks, type ClientRoutineDay, type ClientRoutineExercise } from '@trainerpro/shared';
import { LIGHT } from './light';

export function ClientRoutineDayContent(props: {
  day: ClientRoutineDay;
  t: (key: string) => string;
  renderExercise: (exercise: ClientRoutineExercise, expanded: boolean, toggle: () => void) => React.ReactNode;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{props.day.title}</Text>
        <View style={styles.countPill}>
          <Text style={styles.count}>{`${props.day.exercises.length} ejer`}</Text>
        </View>
      </View>
      {buildExerciseBlocks(props.day.exercises).map((block) => (
        <View
          key={block.exercises.map((exercise) => exercise.id).join('-')}
          style={block.type === 'single' ? styles.single : styles.group}
        >
          {block.type !== 'single' ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {props.t(block.type === 'superset' ? 'mobile.client.session.superset' : 'mobile.client.session.circuit')}
              </Text>
            </View>
          ) : null}
          {block.exercises.map((exercise) => (
            <React.Fragment key={exercise.id}>
              {props.renderExercise(exercise, expanded.has(exercise.id), () => toggle(exercise.id))}
            </React.Fragment>
          ))}
        </View>
      ))}
    </>
  );
}
const styles = StyleSheet.create({
  header: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  title: { color: LIGHT.textStrong, fontSize: 28, fontWeight: '800', flexShrink: 1 },
  countPill: {
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  count: { color: LIGHT.accentDark, fontSize: 12, fontWeight: '700' },
  single: { marginBottom: 12 },
  group: {
    backgroundColor: clientPlanDecorations.groupBackground,
    borderColor: clientPlanDecorations.groupBorder,
    borderRadius: LIGHT.radius2xl,
    borderWidth: 2,
    marginBottom: 16,
    padding: 12,
    paddingTop: 20,
    position: 'relative',
  },
  badge: {
    backgroundColor: LIGHT.bgNavy,
    borderRadius: LIGHT.radiusFull,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    top: -12,
  },
  badgeText: { color: LIGHT.textOnNavy, fontSize: 11, fontWeight: '700' },
});

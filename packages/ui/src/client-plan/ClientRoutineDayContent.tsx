import { clientPlanDecorations } from '../theme/tokens';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  buildExerciseBlocks,
  type ClientRoutineDay,
  type ClientRoutineExercise,
  type ClientRoutineWarmup,
} from '@trainerpro/shared';
import { LIGHT } from './light';

export function ClientRoutineDayContent(props: {
  day: ClientRoutineDay;
  showHeader?: boolean;
  showWarmups?: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  renderExercise: (exercise: ClientRoutineExercise, expanded: boolean, toggle: () => void) => React.ReactNode;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [warmupExpanded, setWarmupExpanded] = useState(false);
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <>
      {props.showHeader !== false ? (
        <View style={styles.header}>
          <Text style={styles.title}>{props.day.title}</Text>
          <View style={styles.countPill}>
            <Text style={styles.count}>{`${props.day.exercises.length} ejer`}</Text>
          </View>
        </View>
      ) : null}
      {props.showWarmups && props.day.warmups?.length ? (
        <View style={styles.warmupCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: warmupExpanded }}
            onPress={() => setWarmupExpanded((current) => !current)}
            style={styles.warmupHeader}
          >
            <View style={styles.warmupIcon}>
              <Text style={styles.warmupIconText}>♨</Text>
            </View>
            <View style={styles.warmupHeading}>
              <View style={styles.warmupTitleRow}>
                <Text style={styles.warmupTitle}>{props.t('mobile.client.warmup.title')}</Text>
                <View style={styles.warmupCountPill}>
                  <Text style={styles.warmupCount}>
                    {props.t('client.planning.exercisesCount', { count: warmupExerciseCount(props.day.warmups) })}
                  </Text>
                </View>
              </View>
              <Text style={styles.warmupDescription} numberOfLines={1}>
                {props.day.warmups.map((warmup) => warmup.description || warmup.name).join(' · ')}
              </Text>
            </View>
            <Text style={styles.warmupChevron}>{warmupExpanded ? '⌃' : '⌄'}</Text>
          </Pressable>
          {warmupExpanded ? (
            <View style={styles.warmupContent}>
              <Text style={styles.warmupNotice}>{props.t('mobile.client.warmup.instructionsOnly')}</Text>
              {props.day.warmups.map((warmup) => (
                <WarmupContent
                  key={warmup.id}
                  warmup={warmup}
                  expanded={expanded}
                  toggle={toggle}
                  t={props.t}
                  renderExercise={props.renderExercise}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
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

function warmupExerciseCount(warmups: ClientRoutineWarmup[]): number {
  return warmups.reduce((count, warmup) => count + warmup.exercises.length, 0);
}

function WarmupContent(props: {
  warmup: ClientRoutineWarmup;
  expanded: Set<string>;
  toggle: (id: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  renderExercise: (exercise: ClientRoutineExercise, expanded: boolean, toggle: () => void) => React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.warmupGroup}>
      <Text style={styles.warmupGroupTitle}>{props.warmup.name}</Text>
      {buildExerciseBlocks(props.warmup.exercises).map((block) => (
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
              {props.renderExercise(exercise, props.expanded.has(exercise.id), () => props.toggle(exercise.id))}
            </React.Fragment>
          ))}
        </View>
      ))}
    </View>
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
  warmupCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radius2xl,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  warmupHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, padding: 14 },
  warmupIcon: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  warmupIconText: { color: LIGHT.accentDark, fontSize: 18 },
  warmupHeading: { flex: 1, minWidth: 0 },
  warmupTitleRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  warmupTitle: { color: LIGHT.accentDark, fontSize: 15, fontWeight: '800' },
  warmupCountPill: {
    borderColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  warmupCount: { color: LIGHT.accentDark, fontSize: 10, fontWeight: '600' },
  warmupDescription: { color: LIGHT.accentDark, fontSize: 11, marginTop: 3 },
  warmupChevron: { color: LIGHT.accentDark, fontSize: 20, paddingHorizontal: 4 },
  warmupContent: { borderTopColor: LIGHT.border, borderTopWidth: 1, padding: 12 },
  warmupNotice: { color: LIGHT.accentDark, fontSize: 11, lineHeight: 16, marginBottom: 12 },
  warmupGroup: { marginBottom: 8 },
  warmupGroupTitle: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '700', marginBottom: 8 },
});

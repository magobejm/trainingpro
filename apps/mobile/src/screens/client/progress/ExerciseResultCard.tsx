import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMetric, type ProgressExerciseType } from '@trainerpro/shared';
import { LIGHT } from '../../../theme/light';
import { getFullMediaUrl } from '../../../utils/library-media.helpers';
import type { ProgressExerciseCard } from './use-progress-dashboard';

const WEIGHTED: ProgressExerciseType[] = ['strength', 'plio', 'isometric', 'sport'];

function loadLabel(applies: boolean, value: number | null, notApplicable: string): string {
  if (!applies) return notApplicable;
  return value === null ? '—' : `${formatMetric(value)} kg`;
}

export function ExerciseResultCard(props: { exercise: ProgressExerciseCard; onPress: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const notApplicable = t('progressDashboard.notApplicable');
  const weighted = WEIGHTED.includes(props.exercise.exerciseType);
  const boxes = [
    {
      id: 'weight',
      label: t('mobile.client.progress.maxWeight'),
      value: loadLabel(weighted, props.exercise.maxWeightKg, notApplicable),
      box: styles.weightBox,
      labelStyle: styles.weightLabel,
      valueStyle: styles.weightValue,
    },
    {
      id: 'pr',
      label: t('mobile.client.progress.estimatedPr'),
      value: loadLabel(
        props.exercise.exerciseType === 'strength' || props.exercise.recordE1rm !== null,
        props.exercise.recordE1rm,
        notApplicable,
      ),
      box: styles.prBox,
      labelStyle: styles.prLabel,
      valueStyle: styles.prValue,
    },
    {
      id: 'times',
      label: t('mobile.client.progress.times'),
      value: formatMetric(props.exercise.sessionCount),
      box: styles.timesBox,
      labelStyle: styles.timesLabel,
      valueStyle: styles.timesValue,
    },
  ];
  return (
    <Pressable
      accessibilityLabel={props.exercise.name}
      accessibilityRole="button"
      onPress={props.onPress}
      style={styles.card}
    >
      <View style={styles.boxes}>
        {boxes.map((box) => (
          <View key={box.id} style={box.box}>
            <Text style={box.labelStyle}>{box.label}</Text>
            <Text style={box.valueStyle}>{box.value}</Text>
          </View>
        ))}
      </View>
      <View style={styles.identity}>
        <Image
          accessibilityLabel={props.exercise.name}
          source={{ uri: getFullMediaUrl(props.exercise.exerciseType, props.exercise.mediaUrl) }}
          style={styles.photo}
        />
        <View style={styles.copy}>
          <View style={styles.badges}>
            {props.exercise.muscleGroup ? (
              <Text style={styles.muscle}>{props.exercise.muscleGroup.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.type}>{t(`mobile.client.progress.group.${props.exercise.exerciseType}`).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{props.exercise.name}</Text>
          <Text style={styles.link}>{t('mobile.client.progress.openTrend')}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const box = {
  borderRadius: LIGHT.radiusMd,
  flex: 1,
  gap: 4,
  minWidth: 0,
  paddingHorizontal: 8,
  paddingVertical: 10,
} as const;

const label = { fontSize: 9, fontWeight: '800' as const, textAlign: 'center' as const, textTransform: 'uppercase' as const };
const value = { fontSize: 16, fontWeight: '800' as const, textAlign: 'center' as const };

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 12,
    padding: 12,
    width: '100%',
  },
  boxes: { flexDirection: 'row', gap: 8 },
  copy: { flex: 1, gap: 4, minWidth: 0 },
  identity: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  link: { color: LIGHT.accent, fontSize: 12, fontWeight: '700' },
  muscle: {
    ...label,
    backgroundColor: LIGHT.accentSoft,
    borderRadius: 6,
    color: LIGHT.accent,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  name: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '800' },
  photo: { backgroundColor: LIGHT.bgNavy, borderRadius: LIGHT.radiusLg, height: 56, width: 56 },
  prBox: { ...box, backgroundColor: '#eff6ff' },
  prLabel: { ...label, color: LIGHT.accent },
  prValue: { ...value, color: LIGHT.accentDark },
  timesBox: { ...box, backgroundColor: '#ecfdf5' },
  timesLabel: { ...label, color: '#047857' },
  timesValue: { ...value, color: '#065f46' },
  type: {
    ...label,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    color: LIGHT.textMuted,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weightBox: { ...box, backgroundColor: LIGHT.bgSoft },
  weightLabel: { ...label, color: LIGHT.textMuted },
  weightValue: { ...value, color: LIGHT.textStrong },
});

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DateRange, ProgressExerciseRef } from '@trainerpro/shared';
import { LIGHT } from '../../../theme/light';
import { EXERCISE_CATEGORIES, filterExercises } from './exercise-filter';
import { ExerciseResultCard } from './ExerciseResultCard';
import { ProgressPeriod } from './ProgressPeriod';
import { useProgressExercises } from './use-progress-dashboard';

export function ExerciseSearch(props: {
  range: DateRange;
  onRange: (range: DateRange) => void;
  historyFrom?: string | null;
  onSelect: (exercise: ProgressExerciseRef) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const query = useProgressExercises(props.range);
  const found = useMemo(() => filterExercises(query.data ?? [], search, category), [query.data, search, category]);
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <Text style={styles.heading}>{t('mobile.client.progress.searchTitle')}</Text>
        <ProgressPeriod historyFrom={props.historyFrom} onChange={props.onRange} range={props.range} />
        <TextInput
          accessibilityLabel={t('progressDashboard.searchExercises')}
          onChangeText={setSearch}
          placeholder={t('progressDashboard.searchExercises')}
          placeholderTextColor={LIGHT.textMuted}
          style={styles.input}
          value={search}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {(['all', ...EXERCISE_CATEGORIES] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: category === value }}
              onPress={() => setCategory(value)}
              style={[styles.chip, category === value && styles.chipOn]}
            >
              <Text style={[styles.chipText, category === value && styles.chipTextOn]}>
                {value === 'all' ? t('progressDashboard.allCategories') : t(`mobile.client.progress.group.${value}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {query.isLoading ? <ActivityIndicator /> : null}
        {query.isError ? <Text style={styles.muted}>{t('progressDashboard.noData')}</Text> : null}
        {query.data && !found.length ? <Text style={styles.muted}>{t('progressDashboard.emptyExercises')}</Text> : null}
      </View>
      {found.map((exercise) => (
        <ExerciseResultCard
          key={`${exercise.exerciseType}:${exercise.exerciseId}`}
          exercise={exercise}
          onPress={() => props.onSelect(exercise)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 10,
    padding: 14,
    width: '100%',
  },
  chip: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipOn: { backgroundColor: LIGHT.accent, borderColor: LIGHT.accent },
  chipText: { color: LIGHT.textStrong, fontSize: 12, fontWeight: '700' },
  chipTextOn: { color: '#ffffff' },
  chips: { gap: 6 },
  heading: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '800' },
  input: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  muted: { color: LIGHT.textMuted, fontSize: 12 },
  stack: { gap: 12, width: '100%' },
});

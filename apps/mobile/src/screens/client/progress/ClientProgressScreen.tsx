import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { defaultRange, type ProgressExerciseRef } from '@trainerpro/shared';
import '../../../i18n';
import { OverlayBackHeader } from '../../../shell/client/client-shell.primitives';
import { LIGHT } from '../../../theme/light';
import { SCREEN } from '../../../theme/sessionStyles';
import { ExerciseProgress } from './ExerciseProgress';
import { ExerciseSearch } from './ExerciseSearch';
import { pickCurrentRoutine } from './exercise-filter';
import { RoutineProgress } from './RoutineProgress';
import { useProgressRoutines } from './use-progress-dashboard';

type Step = 'exercise' | 'home' | 'routine';

export function ClientProgressScreen(props: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const [view, setView] = useState<Step>('home');
  const [exercise, setExercise] = useState<ProgressExerciseRef | null>(null);
  const [range, setRange] = useState(() => defaultRange());
  const catalog = useProgressRoutines();
  const current = pickCurrentRoutine(catalog.data?.routines ?? []);
  const back = () => {
    if (view === 'home') props.onClose();
    else {
      setView('home');
      setExercise(null);
    }
  };
  return (
    <View style={SCREEN.root}>
      <OverlayBackHeader onClose={back} title={t('client.progress.title')} />
      <ScrollView contentContainerStyle={styles.page}>
        {view === 'home' ? (
          <>
            {catalog.isLoading ? <ActivityIndicator /> : null}
            <Pressable
              accessibilityRole="button"
              disabled={!current}
              onPress={() => setView('routine')}
              style={styles.routineCard}
            >
              <View style={styles.between}>
                <Text style={styles.kicker}>{t('mobile.client.progress.currentRoutine')}</Text>
                {current ? <Text style={styles.link}>{`${t('mobile.client.progress.viewAnalytics')} →`}</Text> : null}
              </View>
              <Text style={styles.routineName}>{current ? current.name : t('mobile.client.progress.noRoutine')}</Text>
            </Pressable>
            <ExerciseSearch
              historyFrom={catalog.data?.historyFrom}
              onRange={setRange}
              onSelect={(item) => {
                setExercise(item);
                setView('exercise');
              }}
              range={range}
            />
          </>
        ) : null}
        {view === 'routine' && current ? <RoutineProgress assignmentId={current.assignmentId} /> : null}
        {view === 'exercise' && exercise ? (
          <ExerciseProgress exercise={exercise} historyFrom={catalog.data?.historyFrom} onRange={setRange} range={range} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  between: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { color: LIGHT.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  link: { color: LIGHT.accent, fontSize: 11, fontWeight: '800' },
  page: { alignItems: 'center', gap: 12, padding: 16, paddingBottom: 48 },
  routineCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 6,
    padding: 16,
    width: '100%',
  },
  routineName: { color: LIGHT.textStrong, fontSize: 22, fontWeight: '800' },
});

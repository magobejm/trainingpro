import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@trainerpro/ui';
import type { ProgressExerciseRef } from '@trainerpro/shared';
import { Breadcrumbs } from '../../../layout/Breadcrumbs';
import { buildClientCrumbs, buildProgressDrillCrumbs } from '../../../layout/crumbs';
import type { ShellRoute } from '../../../layout/usePersistentShellRoute';
import { useProgressRoutine } from '../../../data/hooks/useProgressDashboard';
import { useProgressRouteClient } from './useProgressListState';
import { DashboardHome } from './DashboardHome';
import { DashboardRoutine } from './DashboardRoutine';
import { DashboardExercise } from './DashboardExercise';
import { defaultRange } from './dashboard-model';
import { dashboardStyles as styles } from './dashboard.styles';
export function ProgressDashboard(props: { onRouteChange?: (route: ShellRoute) => void }): React.JSX.Element {
  const { t } = useTranslation();
  const { clientId, clientDisplayName } = useProgressRouteClient();
  if (!clientId)
    return (
      <View style={styles.page}>
        <Text style={styles.heading}>{t('coach.progress.empty.title')}</Text>
        <Text style={styles.muted}>{t('coach.progress.empty.subtitle')}</Text>
        <Button label={t('common.back')} onPress={() => props.onRouteChange?.('coach.clients')} variant="secondary" />
      </View>
    );
  return <ClientDashboard key={clientId} clientId={clientId} clientName={clientDisplayName ?? ''} />;
}

function ClientDashboard(props: { clientId: string; clientName: string }): React.JSX.Element {
  const { t } = useTranslation();
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [exercise, setExercise] = useState<ProgressExerciseRef | null>(null);
  const [range, setRange] = useState(() => defaultRange());
  const [selected, setSelected] = useState<number[]>([]);
  const [compare, setCompare] = useState(false);
  const routine = useProgressRoutine(props.clientId, assignmentId);
  const crumbs = progressCrumbs({
    clientId: props.clientId,
    clientName: props.clientName,
    exerciseName: exercise?.name ?? null,
    onExercise: () => setExercise(null),
    onProgress: () => {
      setAssignmentId(null);
      setExercise(null);
      setSelected([]);
      setCompare(false);
    },
    routineName: assignmentId ? (routine.data?.routine.name ?? t('progressDashboard.routines')) : null,
    t,
  });
  const selectRoutine = (id: string) => {
    setAssignmentId(id);
    setSelected([]);
    setCompare(false);
  };
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Breadcrumbs accessibilityLabel={t('app.breadcrumb')} crumbs={crumbs} />
      <View style={styles.column}>
        <Text style={styles.title}>{props.clientName}</Text>
        <Text style={styles.muted}>{t('progressDashboard.subtitle')}</Text>
      </View>
      <View style={{ display: !assignmentId && !exercise ? 'flex' : 'none' }}>
        <DashboardHome
          clientId={props.clientId}
          range={range}
          onRange={setRange}
          onRoutine={selectRoutine}
          onExercise={setExercise}
        />
      </View>
      {assignmentId ? (
        <View style={{ display: exercise ? 'none' : 'flex' }}>
          <DashboardRoutine
            visible={!exercise}
            clientId={props.clientId}
            clientName={props.clientName}
            assignmentId={assignmentId}
            selected={selected}
            compare={compare}
            onSelection={(cycles, comparing) => {
              setSelected(cycles);
              setCompare(comparing);
            }}
            onExercise={setExercise}
          />
        </View>
      ) : null}
      {exercise && (!assignmentId || routine.data) ? (
        <DashboardExercise
          key={`${assignmentId ?? 'global'}:${exercise.exerciseType}:${exercise.exerciseId}`}
          clientId={props.clientId}
          clientName={props.clientName}
          exercise={exercise}
          range={range}
          routine={assignmentId ? routine.data : undefined}
          selected={selected}
          onSelection={(cycles) => {
            setSelected(cycles);
            setCompare(cycles.length > 1);
          }}
          onRange={setRange}
        />
      ) : null}
    </ScrollView>
  );
}

function progressCrumbs(input: {
  clientId: string;
  clientName: string;
  exerciseName: null | string;
  onExercise: () => void;
  onProgress: () => void;
  routineName: null | string;
  t: (key: string) => string;
}) {
  const base = buildClientCrumbs({
    clientId: input.clientId,
    clientName: input.clientName,
    mode: 'progress',
    t: input.t,
  });
  return buildProgressDrillCrumbs({
    base,
    exerciseLabel: input.exerciseName,
    onProgress: input.onProgress,
    onRoutine: input.onExercise,
    routineLabel: input.routineName,
  });
}

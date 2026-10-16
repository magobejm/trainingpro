import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { CoachPage } from './CoachUi';
import { CoachClientPicker } from './CoachClientPicker';
import { CoachCalendarScreen } from './CoachCalendarScreen';
import { CoachNotesScreen } from './CoachNotesScreen';
import { CoachIncidentsScreen } from './CoachIncidentsScreen';
import { CoachPlannerScreen } from './CoachPlannerScreen';
import { CoachLibraryScreen } from './CoachLibraryScreen';
import { CoachProgressScreen } from './CoachProgressScreen';
import { CoachClientHealthScreen } from './CoachClientHealthScreen';
import { CoachTestsScreen } from './CoachTestsScreen';
import { CoachPreferencesScreen, CoachAccountScreen } from './CoachSettingsScreen';
import { CoachNutritionScreen } from './CoachNutritionScreen';
import { CoachEvaluatorScreen } from './CoachEvaluatorScreen';
type Props = { feature: string; clientId?: string; onOpen: (feature: string, clientId?: string) => void };
export function CoachFeatureScreen(props: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(props.clientId ?? '');
  const id = props.clientId ?? selected;
  if (['progress', 'sessions', 'wellness', 'photos', 'measures', 'tests'].includes(props.feature) && !id)
    return (
      <CoachPage title={t('coachWorkspace.' + props.feature)}>
        <CoachClientPicker value={selected} onChange={setSelected} />
      </CoachPage>
    );
  if (props.feature === 'calendar') return <CoachCalendarScreen clientId={props.clientId} onOpen={props.onOpen} />;
  if (props.feature === 'notes') return <CoachNotesScreen clientId={props.clientId} />;
  if (props.feature === 'incidents') return <CoachIncidentsScreen clientId={props.clientId} />;
  if (props.feature === 'routines' || props.feature === 'planning') return <CoachPlannerScreen clientId={props.clientId} />;
  if (props.feature === 'warmups') return <CoachPlannerScreen warmup />;
  if (props.feature === 'library' || props.feature === 'foods')
    return <CoachLibraryScreen initialCategory={props.feature === 'foods' ? 'foods' : undefined} />;
  if (props.feature === 'progress' || props.feature === 'sessions')
    return <CoachProgressScreen key={id} clientId={id} mode={props.feature} />;
  if (props.feature === 'wellness' || props.feature === 'photos' || props.feature === 'measures')
    return <CoachClientHealthScreen key={id} clientId={id} mode={props.feature} />;
  if (props.feature === 'tests') return <CoachTestsScreen key={id} clientId={id} />;
  if (props.feature === 'preferences') return <CoachPreferencesScreen />;
  if (props.feature === 'account') return <CoachAccountScreen />;
  if (props.feature === 'evaluator') return <CoachEvaluatorScreen />;
  if (props.feature === 'nutrition') return <CoachNutritionScreen clientId={props.clientId} />;
  return (
    <CoachPage title={t('coachWorkspace.error')}>
      <Text>{t('coachWorkspace.error')}</Text>
    </CoachPage>
  );
}

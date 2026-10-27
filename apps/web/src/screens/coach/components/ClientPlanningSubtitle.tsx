import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { useAppliedRoutineQuery } from '../../../data/hooks/useRoutineAssignments';
import { planningSummary, readPublishedRoutine } from '../client-planning-view';

type Props = {
  clientId: string;
  style: TextStyle;
  t: (key: string, params?: Record<string, number | string>) => string;
};

/** Row subtitle: the published routine name and how many days it has. */
export function ClientPlanningSubtitle(props: Props): React.JSX.Element {
  const query = useAppliedRoutineQuery(props.clientId);
  if (query.isLoading) return <Text style={props.style}>{props.t('coach.planning.loading')}</Text>;
  const summary = planningSummary(readPublishedRoutine(query.data ?? null));
  const text = summary ? props.t('coach.planning.subtitle', { count: summary.days, name: summary.name }) : null;
  return <Text style={props.style}>{text ?? props.t('coach.clientProfile.details.planning.empty')}</Text>;
}

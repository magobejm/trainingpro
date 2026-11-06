import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { describeWearableDay } from './wearable-day';
import { useClientWearables } from './use-client-wearables';

type Translate = (key: string, options?: Record<string, number | string>) => string;

export function ClientExternalSubtitle(props: { clientId: string; style: TextStyle; t: Translate }): React.JSX.Element {
  const query = useClientWearables(props.clientId);
  const latest = query.data?.metrics[0];
  if (!latest) return <Text style={props.style}>{props.t('coach.clientProfile.details.external.empty')}</Text>;
  const day = describeWearableDay(latest);
  const summary = props.t('coach.wearables.latest', { date: day.date, source: day.source });
  const text = day.steps == null ? summary : `${summary} · ${props.t('coach.wearables.steps', { count: day.steps })}`;
  return <Text style={props.style}>{text}</Text>;
}

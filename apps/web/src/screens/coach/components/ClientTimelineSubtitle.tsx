import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, type TextStyle } from 'react-native';
import { useClientTimelineQuery } from '../../../data/hooks/useClientTimelineQuery';
import { lastEventLine, timelineToday } from './timeline.helpers';

type Translate = (key: string, options?: Record<string, number | string>) => string;

export function ClientTimelineSubtitle(props: { clientId: string; style: TextStyle; t: Translate }): React.JSX.Element {
  const { i18n } = useTranslation();
  const query = useClientTimelineQuery(props.clientId);
  const latest = query.data?.pages[0]?.items[0];
  const text = latest
    ? lastEventLine(latest, props.t, timelineToday(), i18n.language || 'es')
    : props.t('coach.timeline.subtitle');
  return (
    <Text numberOfLines={1} style={props.style}>
      {text}
    </Text>
  );
}

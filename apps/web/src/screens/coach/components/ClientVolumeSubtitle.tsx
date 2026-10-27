import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { useProgressOverviewQuery } from '../../../data/hooks/useProgressQuery';
import { fourWeekRange, volumeSubtitle, volumeTotals } from '../client-volume';

type Props = {
  clientId: string;
  style: TextStyle;
  t: (key: string, params?: Record<string, number | string>) => string;
};

/** Row subtitle: sets and tonnage of the last four weeks, or the empty notice. */
export function ClientVolumeSubtitle(props: Props): React.JSX.Element {
  const range = fourWeekRange(new Date());
  const query = useProgressOverviewQuery({ clientId: props.clientId, from: range.from, to: range.to });
  if (query.isLoading) return <Text style={props.style}>{props.t('coach.volume.loading')}</Text>;
  const text = volumeSubtitle(volumeTotals(query.data ?? null), props.t);
  return <Text style={props.style}>{text ?? props.t('coach.clientProfile.details.weeklyVolume.empty')}</Text>;
}

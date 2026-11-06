import React from 'react';
import { Text, View } from 'react-native';
import { colors, fontSize } from '@trainerpro/ui';
import { describeWearableDay, type WearableMetric } from './wearable-day';

type Translate = (key: string, options?: Record<string, number | string>) => string;

export function WearableDayLines(props: { metric: WearableMetric; t: Translate }): React.JSX.Element {
  const day = describeWearableDay(props.metric);
  return (
    <View>
      <Text style={line}>{props.t('coach.wearables.latest', { date: day.date, source: day.source })}</Text>
      {day.steps != null ? <Text style={line}>{props.t('coach.wearables.steps', { count: day.steps })}</Text> : null}
      {day.sleepHours != null ? (
        <Text style={line}>{props.t('coach.wearables.sleep', { hours: day.sleepHours })}</Text>
      ) : null}
      {day.restingHr != null ? (
        <Text style={line}>{props.t('coach.wearables.resting', { value: day.restingHr })}</Text>
      ) : null}
      {day.hrvMs != null ? <Text style={line}>{props.t('coach.wearables.hrv', { value: day.hrvMs })}</Text> : null}
    </View>
  );
}

const line = { color: colors.text, fontSize: fontSize.sm };

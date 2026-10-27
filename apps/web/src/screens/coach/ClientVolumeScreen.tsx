import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarsChart, SummaryStrip, colors, fontSize, space } from '@trainerpro/ui';
import { LoadingState } from '../../components/AsyncStatus';
import { useProgressOverviewQuery } from '../../data/hooks/useProgressQuery';
import { cardioBars, fourWeekRange, muscleBars, volumeTotals } from './client-volume';

type Translate = (key: string, params?: Record<string, number | string>) => string;

/** Consultation of the last four weeks: sets, tonnage, cardio and one bar per group or method. */
export function ClientVolumeScreen(props: { clientId: string; t: Translate }): React.JSX.Element {
  const range = fourWeekRange(new Date());
  const query = useProgressOverviewQuery({ clientId: props.clientId, from: range.from, to: range.to });
  if (query.isLoading) return <LoadingState label={props.t('coach.volume.loading')} />;
  const totals = volumeTotals(query.data ?? null);
  if (!totals || !query.data) return <Text style={styles.empty}>{props.t('coach.volume.empty')}</Text>;
  return (
    <View style={styles.page}>
      <SummaryStrip
        items={[
          { id: 'sets', label: props.t('coach.volume.sets'), value: String(totals.sets) },
          {
            id: 'kg',
            label: props.t('coach.volume.tonnage'),
            value: props.t('coach.volume.kgValue', { kg: totals.tonnageKg }),
          },
          {
            id: 'cardio',
            label: props.t('coach.volume.cardio'),
            value: props.t('coach.volume.minValue', { minutes: totals.cardioMinutes }),
          },
        ]}
      />
      <BarsChart
        bars={muscleBars(query.data.strengthWeekly)}
        emptyLabel={props.t('coach.volume.emptyChart')}
        title={props.t('coach.volume.strength')}
      />
      <BarsChart
        bars={cardioBars(query.data.cardioWeekly)}
        emptyLabel={props.t('coach.volume.emptyChart')}
        title={props.t('coach.volume.cardioChart')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, fontSize: fontSize.sm },
  page: { gap: space.lg, padding: space.md },
});

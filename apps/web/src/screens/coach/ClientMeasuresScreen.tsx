import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LoadingState } from '../../components/AsyncStatus';
import { useClientByIdQuery, useClientMeasurementsQuery } from '../../data/hooks/useClientsQuery';
import { DateTimeField, colors, fontSize, space, useBreakpoint } from '@trainerpro/ui';
import { MeasuresCharts } from './ClientMeasuresCharts';
import { MeasuresPhotos } from './ClientMeasuresPhotos';
import { MeasuresRecords } from './ClientMeasuresRecords';
import {
  defaultMeasureRange,
  inMeasureRange,
  measureRecords,
  measureSeries,
  readMeasurePhotos,
  type MeasurePhoto,
  type MeasureSource,
} from './client-measures';

type Translate = (key: string, params?: Record<string, number | string>) => string;

/** Consultation of a client's measurements: photos, one chart per series, and the record list. */
export function ClientMeasuresScreen(props: { clientId: string; t: Translate }): React.JSX.Element {
  const client = useClientByIdQuery(props.clientId);
  const measures = useClientMeasurementsQuery(props.clientId);
  const narrow = useBreakpoint() === 'sm';
  if (client.isLoading || measures.isLoading) return <LoadingState label={props.t('coach.measures.loading')} />;
  return (
    <MeasuresBody
      items={measures.data ?? []}
      narrow={narrow}
      photos={readMeasurePhotos(client.data?.progressPhotos ?? [])}
      t={props.t}
    />
  );
}

function MeasuresBody(props: {
  items: MeasureSource[];
  narrow: boolean;
  photos: MeasurePhoto[];
  t: Translate;
}): React.JSX.Element {
  const initial = defaultMeasureRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const photos = props.photos.filter((photo) => inMeasureRange(photo.createdAt, from, to));
  const items = props.items.filter((item) => inMeasureRange(item.measuredAt ?? item.createdAt, from, to));
  const nothingAtAll = props.photos.length === 0 && props.items.length === 0;
  return (
    <View style={styles.page}>
      <MeasureRange from={from} narrow={props.narrow} onFrom={setFrom} onTo={setTo} t={props.t} to={to} />
      {nothingAtAll || (photos.length === 0 && items.length === 0) ? (
        <Text style={styles.empty}>{props.t(nothingAtAll ? 'coach.measures.empty' : 'coach.measures.emptyRange')}</Text>
      ) : (
        <>
          <MeasuresPhotos narrow={props.narrow} photos={photos} t={props.t} />
          <MeasuresCharts series={measureSeries(items)} t={props.t} />
          <MeasuresRecords records={measureRecords(items)} t={props.t} />
        </>
      )}
    </View>
  );
}

function MeasureRange(props: {
  from: string;
  narrow: boolean;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
  t: Translate;
  to: string;
}): React.JSX.Element {
  return (
    <View style={[styles.dates, props.narrow && styles.datesStacked]}>
      <View style={styles.date}>
        <DateTimeField
          label={props.t('coach.compare.from')}
          max={props.to}
          onChange={props.onFrom}
          type={'date'}
          value={props.from}
        />
      </View>
      <View style={styles.date}>
        <DateTimeField
          label={props.t('coach.compare.to')}
          min={props.from}
          onChange={props.onTo}
          type={'date'}
          value={props.to}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  date: { flex: 1, minWidth: 0 },
  dates: { flexDirection: 'row', gap: space.lg },
  datesStacked: { flexDirection: 'column' },
  empty: { color: colors.textMuted, fontSize: fontSize.sm },
  page: { gap: space.lg, padding: space.md },
});

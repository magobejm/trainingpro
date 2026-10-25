import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Button, colors, fontSize, space } from '@trainerpro/ui';
import { useClientMeasurementsQuery } from '../../data/hooks/useClientsQuery';
import type { ProgressPhoto } from './ClientProfileEditScreen.utils';

type Translate = (key: string, options?: Record<string, unknown>) => string;
const RANGE = 'range';

export function BeforeAfterSlider(props: {
  clientId: string;
  photos: ProgressPhoto[];
  t: Translate;
}): React.JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(50);
  const query = useClientMeasurementsQuery(props.clientId);
  if (props.photos.length < 2) return null;
  const before = props.photos[props.photos.length - 1];
  const after = props.photos[0];
  if (!before || !after) return null;
  const delta = describeDelta(query.data ?? [], before.createdAt, after.createdAt, props.t);
  return (
    <View style={{ gap: space.sm, marginTop: space.md }}>
      <Button label={props.t('coach.measurements.compare')} onPress={() => setOpen((value) => !value)} variant="secondary" />
      {open ? (
        <View>
          <View style={{ height: 280, overflow: 'hidden', position: 'relative' }}>
            <Image source={{ uri: after.imageUrl }} style={{ height: 280, width: '100%' }} />
            <View style={{ height: 280, left: 0, overflow: 'hidden', position: 'absolute', top: 0, width: `${position}%` }}>
              <Image source={{ uri: before.imageUrl }} style={{ height: 280, width: 480 }} />
            </View>
          </View>
          <input
            aria-label={props.t('coach.measurements.compare')}
            max={100}
            min={0}
            onChange={(event) => setPosition(Number(event.target.value))}
            type={RANGE}
            value={position}
          />
          <Text style={{ color: colors.text, fontSize: fontSize.sm }}>{delta}</Text>
        </View>
      ) : null}
    </View>
  );
}

function describeDelta(
  items: Array<{ createdAt: string; measuredAt?: string; waistCm: number | null; weightKg: number | null }>,
  beforeAt: string,
  afterAt: string,
  t: Translate,
): string {
  const before = nearest(items, beforeAt);
  const after = nearest(items, afterAt);
  const weight = diff(before?.weightKg, after?.weightKg);
  const waist = diff(before?.waistCm, after?.waistCm);
  return t('coach.measurements.delta', { waist: waist ?? '—', weight: weight ?? '—' });
}

function nearest<T extends { createdAt: string; measuredAt?: string }>(items: T[], at: string): T | null {
  const target = new Date(at).getTime();
  return items.reduce<T | null>((best, item) => {
    const stamp = new Date(item.measuredAt ?? item.createdAt).getTime();
    if (!best) return item;
    const bestStamp = new Date(best.measuredAt ?? best.createdAt).getTime();
    return Math.abs(stamp - target) < Math.abs(bestStamp - target) ? item : best;
  }, null);
}

function diff(before: number | null | undefined, after: number | null | undefined): string | null {
  if (before == null || after == null) return null;
  const value = Math.round((after - before) * 10) / 10;
  return value > 0 ? `+${value}` : String(value);
}

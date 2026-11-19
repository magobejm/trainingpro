import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import { formatClock, formatHeartRateBand, type HeartRateBandKind, type SetVariableKey } from '@trainerpro/shared';
import { SeriesTableBandCell } from '../components/RoutineBlockCard/SeriesTableBandCell';
import { SeriesTableClockCell } from '../components/RoutineBlockCard/SeriesTableClockCell';
import { SeriesTableNumericCell } from '../components/RoutineBlockCard/SeriesTableNumericCell';
import { formatStoredNumber } from '../components/RoutineBlockCard/seriesTableNumeric.utils';
import { SelectCell } from '../components/RoutineBlockCard/SeriesTable.select';
import type { GridSet, SetPatch } from './ClientSeriesTable';

type Translate = (key: string) => string;
type BandKey = 'fcMaxPctMax' | 'fcReservePctMax' | 'heartRateMax';

const COLUMN = 108;
const EMPTY = '--';
const CLOCK: SetVariableKey[] = ['durationSeconds', 'restSeconds'];
const BAND_MAX: Partial<Record<SetVariableKey, BandKey>> = {
  fcMaxPct: 'fcMaxPctMax',
  fcReservePct: 'fcReservePctMax',
  heartRate: 'heartRateMax',
};

export function columnWidth(key: SetVariableKey): number {
  if (CLOCK.includes(key)) return 210;
  if (key === 'distanceMeters' || BAND_MAX[key]) return 120;
  return COLUMN;
}

export function ValueCell(props: {
  editable: boolean;
  label: string;
  locked: boolean;
  logged: null | number | undefined;
  onPatch: (patch: SetPatch) => void;
  placeholder: string;
  set: GridSet;
  t: Translate;
  variable: SetVariableKey;
}): React.JSX.Element {
  const readOnly = !props.editable || props.locked;
  return (
    <View style={[styles.cell, { width: columnWidth(props.variable) }]}>
      {readOnly ? (
        <ReadOnlyValue label={props.label} value={displayValue(props.set, props.variable)} />
      ) : (
        <Editor {...props} />
      )}
      <LoggedValue value={props.logged} variable={props.variable} />
    </View>
  );
}

function Editor(props: {
  label: string;
  onPatch: (patch: SetPatch) => void;
  placeholder: string;
  set: GridSet;
  t: Translate;
  variable: SetVariableKey;
}): React.JSX.Element {
  const { set, variable } = props;
  const maxKey = BAND_MAX[variable];
  if (variable === 'rom') return <RomSelect onPatch={props.onPatch} set={set} t={props.t} />;
  if (CLOCK.includes(variable)) {
    return (
      <View style={styles.fill}>
        <SeriesTableClockCell
          onChange={(value) => props.onPatch({ [variable]: value ?? null })}
          placeholder={props.placeholder}
          readOnly={false}
          value={asNumber(set[variable]) ?? undefined}
        />
      </View>
    );
  }
  if (maxKey) {
    return (
      <View style={styles.fill}>
        <SeriesTableBandCell
          kind={bandKind(variable)}
          max={asNumber(set[maxKey])}
          min={asNumber(set[variable])}
          onChange={(band) => props.onPatch({ [variable]: band.min, [maxKey]: band.max })}
          placeholder={props.placeholder}
          readOnly={false}
        />
      </View>
    );
  }
  const stored = asNumber(set[variable]);
  const distance = variable === 'distanceMeters';
  return (
    <View style={styles.fill}>
      <SeriesTableNumericCell
        fieldKey={variable}
        numericMode={distance ? 'distance' : undefined}
        onChange={(value) => props.onPatch({ [variable]: storedNumber(variable, value) })}
        placeholder={props.placeholder}
        readOnly={false}
        value={stored == null ? undefined : distance ? stored / 1000 : stored}
      />
    </View>
  );
}

function RomSelect(props: { onPatch: (patch: SetPatch) => void; set: GridSet; t: Translate }): React.JSX.Element {
  const options = [
    props.t('coach.routine.seriesTable.rom.full'),
    props.t('coach.routine.seriesTable.rom.partial'),
    props.t('coach.routine.seriesTable.rom.minimal'),
  ];
  const current = asText(props.set.rom);
  return (
    <SelectCell
      onChange={(value) => props.onPatch({ rom: value || null })}
      options={options.includes(current) || !current ? options : [...options, current]}
      selectPlaceholder={props.t('coach.routine.seriesTable.selectPlaceholder')}
      value={current}
    />
  );
}

type FieldValues = Partial<Record<BandKey | SetVariableKey, null | number | string>>;

function displayValue(set: FieldValues, key: SetVariableKey): string {
  const maxKey = BAND_MAX[key];
  if (maxKey) return formatHeartRateBand(asNumber(set[key]), asNumber(set[maxKey]));
  if (CLOCK.includes(key)) {
    const seconds = asNumber(set[key]);
    return seconds == null ? '' : formatClock(seconds);
  }
  if (key === 'distanceMeters') {
    const meters = asNumber(set[key]);
    return meters == null ? '' : String(meters / 1000);
  }
  if (key === 'rpe' || key === 'weightKg') {
    const value = asNumber(set[key]);
    return value == null ? '' : formatStoredNumber(value, key === 'rpe' ? 'rpeHalf' : 'weight');
  }
  return asText(set[key]);
}

function storedNumber(key: SetVariableKey, value: number | undefined): null | number {
  if (value == null) return null;
  return key === 'distanceMeters' ? Math.round(value * 1000) : value;
}

function bandKind(key: SetVariableKey): HeartRateBandKind {
  return key === 'heartRate' ? 'heartRate' : 'percent';
}

function asNumber(value: null | number | string | undefined): number | null {
  return typeof value === 'number' ? value : null;
}

function asText(value: null | number | string | undefined): string {
  return value == null ? '' : String(value);
}

function ReadOnlyValue(props: { label: string; value: string }): React.JSX.Element {
  return (
    <View accessibilityLabel={props.label} style={styles.readOnly}>
      <Text style={styles.readOnlyText}>{props.value || EMPTY}</Text>
    </View>
  );
}

function LoggedValue(props: { value: null | number | undefined; variable: SetVariableKey }): React.JSX.Element {
  if (props.value == null) return <Text style={styles.emptyLog}>{EMPTY}</Text>;
  return <Text style={styles.logged}>{displayValue({ [props.variable]: props.value }, props.variable)}</Text>;
}

const styles = StyleSheet.create({
  cell: { alignItems: 'center', gap: 2 },
  emptyLog: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', minHeight: 16 },
  fill: { width: '100%' },
  logged: { color: colors.success, fontSize: fontSize.xs, fontWeight: '600', minHeight: 16 },
  readOnly: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    width: '100%',
  },
  readOnlyText: { color: colors.text, fontSize: fontSize.sm, textAlign: 'center' },
});

import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SessionItem } from '@trainerpro/shared';
import { LIGHT } from '../../theme/light';
import { sanitizeSessionNumber } from './session-number-input';
import { showError, showToast } from '../../shell/client/feedback';
import type { EnqueueResult } from '../../data/hooks/useSessionDraft';
function sumDistance(values: Array<number | null | undefined>): number | null {
  const actual = values.filter((value): value is number => value != null && Number.isFinite(value));
  return actual.length ? actual.reduce((sum, value) => sum + value, 0) : null;
}
export function exerciseDistanceMeters(item: SessionItem): number | null {
  if (item.type === 'cardio')
    return item.distanceDoneMeters ?? sumDistance(item.intervalLogs.map((row) => row.distanceDoneMeters));
  if (item.type === 'sport') return sumDistance(item.setLogs.map((row) => row.distanceDoneMeters));
  return null;
}
export function ExerciseDistanceHeader(props: {
  item: SessionItem;
  readOnly?: boolean;
  onSave?: (blockId: string, distanceDoneMeters: number | null) => Promise<EnqueueResult | 'missing' | void> | void;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const metres = exerciseDistanceMeters(props.item);
  const [value, setValue] = useState(metres == null ? '' : String(metres / 1000));
  const [busy, setBusy] = useState(false);
  useEffect(() => setValue(metres == null ? '' : String(metres / 1000)), [props.item.id, metres]);
  if (props.item.type !== 'cardio' && props.item.type !== 'sport') return null;
  const editable = props.item.type === 'cardio' && !props.readOnly && Boolean(props.onSave);
  const save = async () => {
    const next = value.trim() === '' ? null : Number(value.replace(',', '.')) * 1000;
    if (next !== null && (!Number.isFinite(next) || next < 0 || next > 500000)) {
      showError(t('mobile.client.exercise.distanceInvalid'));
      return;
    }
    setBusy(true);
    try {
      const result = await props.onSave?.(props.item.id, next);
      if (result === 'pending') showToast(t('mobile.client.sync.savedOffline'));
    } catch (error) {
      showError(error instanceof Error ? error.message : t('mobile.client.exercise.distanceInvalid'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t('mobile.client.history.distanceKm')}</Text>
      {editable ? (
        <View style={styles.row}>
          <TextInput
            accessibilityLabel={t('mobile.client.history.distanceKm')}
            editable={!busy}
            keyboardType={'decimal-pad'}
            onChangeText={(text) => setValue(sanitizeSessionNumber('distance', text))}
            style={styles.input}
            value={value}
          />
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save()} style={styles.button}>
            <Text style={styles.buttonText}>{t('mobile.client.exercise.saveDistance')}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.label}>
          {metres == null ? '—' : metres / 1000}
          {' km'}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderWidth: 1,
    borderRadius: LIGHT.radiusXl,
    padding: 16,
    gap: 8,
  },
  label: { color: LIGHT.textStrong, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  input: { borderColor: LIGHT.border, borderWidth: 1, borderRadius: 8, padding: 12, color: LIGHT.textStrong, flex: 1 },
  button: { backgroundColor: LIGHT.accent, borderRadius: 8, padding: 12 },
  buttonText: { color: '#fff', fontWeight: '700' },
});

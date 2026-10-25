import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { LIGHT } from '../../theme/light';
import { readMeasurementForm, type MeasurementKey } from './client-measures.helpers';
import { useRecordMeasurementMutation } from './use-client-progress';
import { readLatestWeightKg } from '../../health';

const FIELDS: MeasurementKey[] = ['weightKg', 'waistCm', 'hipCm', 'heightCm'];
const EMPTY: Record<MeasurementKey, string> = { heightCm: '', hipCm: '', waistCm: '', weightKg: '' };
const LABELS: Record<MeasurementKey, string> = {
  heightCm: 'client.measures.fields.height',
  hipCm: 'client.measures.fields.hip',
  waistCm: 'client.measures.fields.waist',
  weightKg: 'client.measures.fields.weight',
};

type Props = { onClose: () => void };

export function ClientMeasuresForm(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const save = useRecordMeasurementMutation();
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');
  useEffect(() => {
    void readLatestWeightKg().then((weight) => {
      if (weight == null) return;
      setValues((current) => (current.weightKg ? current : { ...current, weightKg: String(weight) }));
    });
  }, []);
  return (
    <Modal animationType={'fade'} onRequestClose={props.onClose} transparent visible>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('client.measures.form.title')}</Text>
          {FIELDS.map((field) => (
            <MeasureField
              key={field}
              label={t(LABELS[field])}
              onChange={(text) => setValues((prev) => ({ ...prev, [field]: text }))}
              value={values[field]}
            />
          ))}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => void submit(values, save.mutateAsync, setError, t, props.onClose)} style={styles.save}>
            <Text style={styles.saveText}>
              {save.isPending ? t('client.measures.form.saving') : t('client.measures.form.save')}
            </Text>
          </Pressable>
          <Pressable onPress={props.onClose}>
            <Text style={styles.cancel}>{t('client.measures.form.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function MeasureField(props: { label: string; onChange: (text: string) => void; value: string }): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput keyboardType={'decimal-pad'} onChangeText={props.onChange} style={styles.input} value={props.value} />
    </View>
  );
}

async function submit(
  values: Record<MeasurementKey, string>,
  mutate: ReturnType<typeof useRecordMeasurementMutation>['mutateAsync'],
  setError: (message: string) => void,
  t: (key: string) => string,
  onClose: () => void,
): Promise<void> {
  const parsed = readMeasurementForm(values);
  if ('error' in parsed) {
    setError(t(parsed.error === 'empty' ? 'client.measures.form.empty' : 'client.measures.form.invalid'));
    return;
  }
  try {
    await mutate(parsed.body);
    onClose();
  } catch {
    setError(t('client.measures.form.error'));
  }
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: LIGHT.overlay, flex: 1, justifyContent: 'center', padding: 20 },
  cancel: { color: LIGHT.textMuted, fontWeight: '700', textAlign: 'center' },
  card: { backgroundColor: LIGHT.bgCard, borderRadius: LIGHT.radiusLg, gap: 12, padding: 16, width: '100%' },
  error: { color: LIGHT.error, fontSize: 13 },
  field: { gap: 4 },
  input: { borderColor: LIGHT.borderStrong, borderRadius: LIGHT.radiusSm, borderWidth: 1, color: LIGHT.text, padding: 10 },
  label: { color: LIGHT.textMuted, fontSize: 12, fontWeight: '700' },
  save: { alignItems: 'center', backgroundColor: LIGHT.accent, borderRadius: LIGHT.radiusFull, paddingVertical: 12 },
  saveText: { color: LIGHT.textOnNavy, fontWeight: '700' },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '700' },
});

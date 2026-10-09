import { physicalTestFields, type PhysicalTestFieldKey } from '@trainerpro/shared';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import {
  useRecordPhysicalTestResultMutation,
  type PhysicalTestResultView,
  type RecordPhysicalTestInput,
} from '../../data/hooks/usePhysicalTests';
import { useClientMeQuery } from '../../data/hooks/useClientMeQuery';
import { LIGHT } from '../../theme/light';

type Props = {
  onSaved: (result: PhysicalTestResultView) => void;
  scheduleId?: string;
  showTitle?: boolean;
  testId: string;
  testName: string;
};

const DECIMAL_PAD = 'decimal-pad' as const;

export function PhysicalTestResultForm(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const clientQuery = useClientMeQuery();
  const mutation = useRecordPhysicalTestResultMutation();
  const fields = useMemo(() => physicalTestFields(props.testName), [props.testName]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [eyesClosed, setEyesClosed] = useState(false);
  const [gender, setGender] = useState<'F' | 'M'>('M');
  const [level, setLevel] = useState<'Avanzado' | 'Recreacional'>('Recreacional');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = clientQuery.data;
    if (!client) return;
    setValues((prev) => ({ ...initialValues(client), ...filled(prev) }));
    if (client.sex === 'female') setGender('F');
    else if (client.sex === 'male') setGender('M');
  }, [clientQuery.data]);

  const submit = async () => {
    const age = Number(values.age);
    if (!Number.isInteger(age) || age < 5) {
      setError(t('client.physicalTests.form.ageRequired'));
      return;
    }
    const input = buildInput(fields, values, { age, eyesClosed, gender, level });
    try {
      const result = await mutation.mutateAsync({ input, scheduleId: props.scheduleId, testId: props.testId });
      props.onSaved(result);
    } catch {
      setError(t('client.physicalTests.form.submitError'));
    }
  };

  return (
    <View style={styles.form}>
      {props.showTitle === false ? null : <Text style={styles.infoTitle}>{t('client.physicalTests.recordTitle')}</Text>}
      {fields.map((field) => (
        <Field
          eyesClosed={eyesClosed}
          field={field}
          gender={gender}
          key={field}
          level={level}
          onEyes={setEyesClosed}
          onGender={setGender}
          onLevel={setLevel}
          onValue={(value) => setValues((prev) => ({ ...prev, [field]: value }))}
          t={t}
          value={values[field] ?? ''}
        />
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable disabled={mutation.isPending} onPress={() => void submit()} style={styles.primary}>
        <Text style={styles.primaryText}>
          {mutation.isPending ? t('client.physicalTests.form.saving') : t('client.physicalTests.form.submit')}
        </Text>
      </Pressable>
    </View>
  );
}

function Field(props: {
  eyesClosed: boolean;
  field: PhysicalTestFieldKey;
  gender: 'F' | 'M';
  level: 'Avanzado' | 'Recreacional';
  onEyes: (value: boolean) => void;
  onGender: (value: 'F' | 'M') => void;
  onLevel: (value: 'Avanzado' | 'Recreacional') => void;
  onValue: (value: string) => void;
  t: (key: string) => string;
  value: string;
}): React.JSX.Element {
  if (props.field === 'gender') {
    return (
      <Choice
        label={props.t('client.physicalTests.form.gender')}
        onPick={(value) => props.onGender(value as 'F' | 'M')}
        options={[
          { id: 'M', label: props.t('client.physicalTests.form.male') },
          { id: 'F', label: props.t('client.physicalTests.form.female') },
        ]}
        selected={props.gender}
      />
    );
  }
  if (props.field === 'eyesClosed') {
    return (
      <Choice
        label={props.t('client.physicalTests.form.eyesClosed')}
        onPick={(value) => props.onEyes(value === 'closed')}
        options={[
          { id: 'open', label: props.t('client.physicalTests.form.eyesOpen') },
          { id: 'closed', label: props.t('client.physicalTests.form.eyesClosedOption') },
        ]}
        selected={props.eyesClosed ? 'closed' : 'open'}
      />
    );
  }
  if (props.field === 'level') {
    return (
      <Choice
        label={props.t('client.physicalTests.form.level')}
        onPick={(value) => props.onLevel(value as 'Avanzado' | 'Recreacional')}
        options={[
          { id: 'Recreacional', label: props.t('client.physicalTests.form.levelRecreational') },
          { id: 'Avanzado', label: props.t('client.physicalTests.form.levelAdvanced') },
        ]}
        selected={props.level}
      />
    );
  }
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t(`client.physicalTests.form.${props.field}`)}</Text>
      <TextInput keyboardType={DECIMAL_PAD} onChangeText={props.onValue} style={styles.input} value={props.value} />
    </View>
  );
}

function Choice(props: {
  label: string;
  onPick: (id: string) => void;
  options: Array<{ id: string; label: string }>;
  selected: string;
}): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.choices}>
        {props.options.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => props.onPick(option.id)}
            style={[styles.choice, props.selected === option.id && styles.choiceOn]}
          >
            <Text style={[styles.choiceText, props.selected === option.id && styles.choiceTextOn]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function filled(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
}

function initialValues(client: { birthDate?: string | null; weightKg?: number | null } | undefined): Record<string, string> {
  const values: Record<string, string> = {};
  if (client?.weightKg) values.weight = String(client.weightKg);
  if (client?.birthDate) {
    const birth = new Date(client.birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
      years -= 1;
    }
    if (years > 0) values.age = String(years);
  }
  return values;
}

function buildInput(
  fields: PhysicalTestFieldKey[],
  values: Record<string, string>,
  extra: { age: number; eyesClosed: boolean; gender: 'F' | 'M'; level: 'Avanzado' | 'Recreacional' },
): RecordPhysicalTestInput {
  const input: RecordPhysicalTestInput = { age: extra.age, gender: extra.gender };
  const numeric: Array<'distance' | 'hr' | 'palier' | 'reps' | 'timeMin' | 'timeSec' | 'weight' | 'workload'> = [
    'distance',
    'hr',
    'palier',
    'reps',
    'timeMin',
    'timeSec',
    'weight',
    'workload',
  ];
  for (const key of numeric) {
    if (fields.includes(key) && values[key]) input[key] = Number(values[key]);
  }
  if (fields.includes('eyesClosed')) input.eyesClosed = extra.eyesClosed;
  if (fields.includes('level')) input.level = extra.level;
  return input;
}

const styles = StyleSheet.create({
  choice: { borderColor: LIGHT.border, borderRadius: 10, borderWidth: 1, flex: 1, paddingVertical: 10 },
  choiceOn: { backgroundColor: LIGHT.accent, borderColor: LIGHT.accent },
  choiceText: { color: LIGHT.textMuted, fontWeight: '700', textAlign: 'center' },
  choiceTextOn: { color: LIGHT.textOnNavy },
  choices: { flexDirection: 'row', gap: 8 },
  error: { color: LIGHT.error, fontSize: 13 },
  field: { gap: 6 },
  form: { backgroundColor: LIGHT.bgCard, borderColor: LIGHT.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 14 },
  infoTitle: { color: LIGHT.accentDark, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  input: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.border,
    borderRadius: 10,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: { color: LIGHT.textMuted, fontSize: 12, fontWeight: '700' },
  primary: { alignItems: 'center', backgroundColor: LIGHT.accent, borderRadius: 12, paddingVertical: 12 },
  primaryText: { color: LIGHT.textOnNavy, fontWeight: '800' },
});

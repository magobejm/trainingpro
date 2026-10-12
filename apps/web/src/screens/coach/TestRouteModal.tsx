import { physicalTestFields, type PhysicalTestFieldKey } from '@trainerpro/shared';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PhysicalTestResultView, PhysicalTestView, TestInputs } from '../../data/hooks/usePhysicalTests';
import { Button, Field, Modal, SegmentedControl, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';

const VARIANT_SECONDARY = 'secondary' as const;
const MODAL_SIZE = 'md' as const;
const KEYBOARD_NUMERIC = 'numeric' as const;

type Props = {
  clientAge?: number | null;
  clientGender?: 'F' | 'M' | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (inputs: TestInputs) => void;
  result?: PhysicalTestResultView | null;
  t: (key: string) => string;
  test: PhysicalTestView | null;
  visible: boolean;
};

type FieldKey = PhysicalTestFieldKey;

type FieldState = {
  age: string;
  distance: string;
  eyesClosed: boolean;
  gender: 'F' | 'M';
  hr: string;
  level: 'Avanzado' | 'Recreacional';
  palier: string;
  reps: string;
  timeMin: string;
  timeSec: string;
  weight: string;
  workload: string;
};

export function TestRouteModal(props: Props): React.JSX.Element {
  const fields = useMemo(() => physicalTestFields(props.test?.name ?? ''), [props.test?.name]);
  const [state, setState] = useState<FieldState>(() => createInitialState(props));
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (props.visible) {
      setState(createInitialState(props));
      setSubmitted(false);
    }
  }, [props.visible, props.test?.id, props.clientAge, props.clientGender]);

  const onSubmit = () => {
    setSubmitted(true);
    const inputs = toInputs(state, fields);
    if (!inputs) return;
    props.onSubmit(inputs);
  };

  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={
        <>
          <Button label={props.t('common.cancel')} onPress={props.onClose} variant={VARIANT_SECONDARY} />
          <Button
            label={props.isSubmitting ? props.t('coach.tests.route.calculating') : props.t('coach.tests.route.calculate')}
            loading={props.isSubmitting}
            onPress={onSubmit}
          />
        </>
      }
      onClose={props.onClose}
      size={MODAL_SIZE}
      title={props.t('coach.tests.route.title')}
      visible={props.visible}
    >
      {props.test ? <Text style={styles.subtitle}>{props.test.name}</Text> : null}
      <View style={styles.content}>
        {fields.map((field) => renderField(field, state, setState, props.t, submitted))}
        {props.result ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{props.t('coach.tests.route.result')}</Text>
            <Text style={styles.resultLine}>{props.result.rawScore}</Text>
            <Text style={styles.resultClassification}>{props.result.classification}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function createInitialState(props: Pick<Props, 'clientAge' | 'clientGender'>): FieldState {
  return {
    age: props.clientAge ? String(props.clientAge) : '',
    distance: '',
    eyesClosed: false,
    gender: props.clientGender ?? 'M',
    hr: '',
    level: 'Recreacional',
    palier: '',
    reps: '',
    timeMin: '',
    timeSec: '',
    weight: '',
    workload: '',
  };
}

function choiceField(
  field: string,
  label: string,
  options: Array<{ label: string; value: string }>,
  value: string,
  onChange: (value: string) => void,
): React.JSX.Element {
  return (
    <Field key={field} label={label}>
      <SegmentedControl accessibilityLabel={label} onChange={onChange} options={options} value={value} />
    </Field>
  );
}

function renderField(
  field: FieldKey,
  state: FieldState,
  setState: React.Dispatch<React.SetStateAction<FieldState>>,
  t: Props['t'],
  submitted: boolean,
): React.JSX.Element {
  if (field === 'gender') {
    const options = [
      { label: t('coach.tests.fields.genderMale'), value: 'M' },
      { label: t('coach.tests.fields.genderFemale'), value: 'F' },
    ];
    return choiceField(field, t('coach.tests.fields.gender'), options, state.gender, (value) =>
      setState((prev) => ({ ...prev, gender: value === 'F' ? 'F' : 'M' })),
    );
  }
  if (field === 'eyesClosed') {
    const options = [
      { label: t('coach.tests.fields.eyesOpen'), value: 'open' },
      { label: t('coach.tests.fields.eyesClosedOption'), value: 'closed' },
    ];
    const current = state.eyesClosed ? 'closed' : 'open';
    return choiceField(field, t('coach.tests.fields.eyesClosed'), options, current, (value) =>
      setState((prev) => ({ ...prev, eyesClosed: value === 'closed' })),
    );
  }
  if (field === 'level') {
    const options = [
      { label: t('coach.tests.fields.levelRecreational'), value: 'Recreacional' },
      { label: t('coach.tests.fields.levelAdvanced'), value: 'Avanzado' },
    ];
    return choiceField(field, t('coach.tests.fields.level'), options, state.level, (value) =>
      setState((prev) => ({ ...prev, level: value === 'Avanzado' ? 'Avanzado' : 'Recreacional' })),
    );
  }
  const ageInvalid = field === 'age' && submitted && !(Number(state.age) > 0);
  return (
    <TextField
      error={ageInvalid ? t('coach.tests.route.ageRequired') : null}
      key={field}
      keyboardType={KEYBOARD_NUMERIC}
      label={t(`coach.tests.fields.${field}`)}
      onChangeText={(text) => setState((prev) => ({ ...prev, [field]: text }))}
      required={field === 'age'}
      value={state[field]}
    />
  );
}

function toInputs(state: FieldState, fields: FieldKey[]): TestInputs | null {
  const age = Number(state.age);
  if (!Number.isFinite(age) || age <= 0) return null;
  const inputs: TestInputs = { gender: state.gender, age };
  if (fields.includes('weight') && state.weight) inputs.weight = Number(state.weight);
  if (fields.includes('timeMin') && state.timeMin) inputs.timeMin = Number(state.timeMin);
  if (fields.includes('timeSec') && state.timeSec) inputs.timeSec = Number(state.timeSec);
  if (fields.includes('hr') && state.hr) inputs.hr = Number(state.hr);
  if (fields.includes('distance') && state.distance) inputs.distance = Number(state.distance);
  if (fields.includes('reps') && state.reps) inputs.reps = Number(state.reps);
  if (fields.includes('palier') && state.palier) inputs.palier = Number(state.palier);
  if (fields.includes('workload') && state.workload) inputs.workload = Number(state.workload);
  if (fields.includes('eyesClosed')) inputs.eyesClosed = state.eyesClosed;
  if (fields.includes('level')) inputs.level = state.level;
  return inputs;
}

const styles = StyleSheet.create({
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: space.sm,
  },
  content: {
    gap: space.md,
  },
  resultCard: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.xs,
    padding: space.lg,
  },
  resultTitle: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  resultLine: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  resultClassification: {
    color: colors.success,
    fontSize: fontSize.sm,
  },
});

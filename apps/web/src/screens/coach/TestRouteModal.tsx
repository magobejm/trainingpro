import { physicalTestFields, type PhysicalTestFieldKey } from '@trainerpro/shared';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { PhysicalTestResultView, PhysicalTestView, TestInputs } from '../../data/hooks/usePhysicalTests';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const MODAL_ANIMATION_FADE = 'fade' as const;
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
  useEffect(() => {
    if (props.visible) setState(createInitialState(props));
  }, [props.visible, props.test?.id, props.clientAge, props.clientGender]);

  const onSubmit = () => {
    const inputs = toInputs(state, fields);
    if (!inputs) return;
    props.onSubmit(inputs);
  };

  return (
    <Modal animationType={MODAL_ANIMATION_FADE} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{props.t('coach.tests.route.title')}</Text>
          {props.test ? <Text style={styles.subtitle}>{props.test.name}</Text> : null}
          <ScrollView contentContainerStyle={styles.content}>
            {fields.map((field) => renderField(field, state, setState, props.t))}
            {props.result ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>{props.t('coach.tests.route.result')}</Text>
                <Text style={styles.resultLine}>{props.result.rawScore}</Text>
                <Text style={styles.resultClassification}>{props.result.classification}</Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable onPress={props.onClose} style={styles.cancelButton}>
              <Text style={styles.cancelLabel}>{props.t('common.cancel')}</Text>
            </Pressable>
            <Pressable disabled={props.isSubmitting} onPress={onSubmit} style={styles.submitButton}>
              <Text style={styles.submitLabel}>
                {props.isSubmitting ? props.t('coach.tests.route.calculating') : props.t('coach.tests.route.calculate')}
              </Text>
            </Pressable>
          </View>
        </View>
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

function renderField(
  field: FieldKey,
  state: FieldState,
  setState: React.Dispatch<React.SetStateAction<FieldState>>,
  t: Props['t'],
): React.JSX.Element {
  if (field === 'gender') {
    return (
      <View key={field} style={styles.fieldBlock}>
        <Text style={styles.label}>{t('coach.tests.fields.gender')}</Text>
        <View style={styles.choiceRow}>
          <ChoiceButton
            active={state.gender === 'M'}
            label={t('coach.tests.fields.genderMale')}
            onPress={() => setState((prev) => ({ ...prev, gender: 'M' }))}
          />
          <ChoiceButton
            active={state.gender === 'F'}
            label={t('coach.tests.fields.genderFemale')}
            onPress={() => setState((prev) => ({ ...prev, gender: 'F' }))}
          />
        </View>
      </View>
    );
  }
  if (field === 'eyesClosed') {
    return (
      <View key={field} style={styles.fieldBlock}>
        <Text style={styles.label}>{t('coach.tests.fields.eyesClosed')}</Text>
        <View style={styles.choiceRow}>
          <ChoiceButton
            active={!state.eyesClosed}
            label={t('coach.tests.fields.eyesOpen')}
            onPress={() => setState((prev) => ({ ...prev, eyesClosed: false }))}
          />
          <ChoiceButton
            active={state.eyesClosed}
            label={t('coach.tests.fields.eyesClosedOption')}
            onPress={() => setState((prev) => ({ ...prev, eyesClosed: true }))}
          />
        </View>
      </View>
    );
  }
  if (field === 'level') {
    return (
      <View key={field} style={styles.fieldBlock}>
        <Text style={styles.label}>{t('coach.tests.fields.level')}</Text>
        <View style={styles.choiceRow}>
          <ChoiceButton
            active={state.level === 'Recreacional'}
            label={t('coach.tests.fields.levelRecreational')}
            onPress={() => setState((prev) => ({ ...prev, level: 'Recreacional' }))}
          />
          <ChoiceButton
            active={state.level === 'Avanzado'}
            label={t('coach.tests.fields.levelAdvanced')}
            onPress={() => setState((prev) => ({ ...prev, level: 'Avanzado' }))}
          />
        </View>
      </View>
    );
  }
  const value = state[field];
  return (
    <View key={field} style={styles.fieldBlock}>
      <Text style={styles.label}>{t(`coach.tests.fields.${field}`)}</Text>
      <TextInput
        keyboardType={KEYBOARD_NUMERIC}
        onChangeText={(text) => setState((prev) => ({ ...prev, [field]: text }))}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function ChoiceButton(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.choiceButton, props.active && styles.choiceButtonActive]}>
      <Text style={[styles.choiceLabel, props.active && styles.choiceLabelActive]}>{props.label}</Text>
    </Pressable>
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
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    maxHeight: '90%',
    maxWidth: 640,
    padding: space.xl,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: space.xs,
  },
  content: {
    gap: space.md,
    paddingVertical: space.lg,
  },
  fieldBlock: {
    gap: space.sm,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  choiceButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: space.md,
  },
  choiceButtonActive: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  choiceLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  choiceLabelActive: {
    color: colors.primary,
    fontWeight: '600',
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
  actions: {
    flexDirection: 'row',
    gap: space.md,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: space.md,
  },
  cancelLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flex: 1,
    paddingVertical: space.md,
  },
  submitLabel: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});

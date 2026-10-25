import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { LIGHT } from '../../theme/light';
import {
  formatLoadKg,
  groupPlates,
  percentOfE1rm,
  platesPerSide,
  RPE_STEPS,
  weightForRpe,
  type PlateLoad,
} from './barbell-load';

const BARS = [20, 15] as const;

type Props = {
  e1rm: number | null;
  initialWeight: string;
  onClose: () => void;
  onUse: (weight: string) => void;
  reps: number;
  visible: boolean;
};

export function WeightCalculatorModal(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const form = useCalculatorForm(props);
  const target = parseKg(form.weight);
  const load = platesPerSide(target ?? 0, form.bar);
  const oneRm = parseKg(form.oneRm);
  return (
    <Modal animationType={'fade'} onRequestClose={props.onClose} transparent visible={props.visible}>
      <Pressable onPress={props.onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <CalculatorBody
            form={form}
            load={load}
            oneRm={oneRm}
            onClose={props.onClose}
            onUse={props.onUse}
            reps={props.reps}
            t={t}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CalculatorBody(props: {
  form: ReturnType<typeof useCalculatorForm>;
  load: PlateLoad;
  oneRm: number | null;
  onClose: () => void;
  onUse: (weight: string) => void;
  reps: number;
  t: TFunction;
}): React.JSX.Element {
  const percent = props.oneRm == null ? null : percentOfE1rm(props.load.loadedKg, props.oneRm);
  return (
    <ScrollView keyboardShouldPersistTaps={'handled'}>
      <Text style={styles.title}>{props.t('mobile.client.session.calculatorTitle')}</Text>
      <BarPicker bar={props.form.bar} onChange={props.form.setBar} t={props.t} />
      <PlateList load={props.load} t={props.t} />
      {percent != null ? <Text style={styles.hint}>{props.t('mobile.client.session.percent', { percent })}</Text> : null}
      <Text style={styles.label}>{props.t('mobile.client.session.oneRm')}</Text>
      <TextInput
        keyboardType={'decimal-pad'}
        onChangeText={props.form.setOneRm}
        style={styles.input}
        value={props.form.oneRm}
      />
      <RpeList oneRm={props.oneRm} onPick={props.form.setWeight} reps={props.reps} t={props.t} />
      <Pressable
        accessibilityLabel={props.t('mobile.client.session.useWeight')}
        accessibilityRole={'button'}
        onPress={() => props.onUse(formatLoadKg(props.load.loadedKg))}
        style={styles.use}
      >
        <Text style={styles.useText}>{props.t('mobile.client.session.useWeight')}</Text>
      </Pressable>
      <Pressable accessibilityRole={'button'} onPress={props.onClose} style={styles.close}>
        <Text style={styles.closeText}>{props.t('mobile.client.session.closeCalculator')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function useCalculatorForm(props: Props) {
  const [bar, setBar] = useState<(typeof BARS)[number]>(20);
  const [oneRm, setOneRm] = useState('');
  const [weight, setWeight] = useState('');
  useEffect(() => {
    if (!props.visible) return;
    setBar(20);
    setWeight(props.initialWeight);
    setOneRm(props.e1rm == null ? '' : formatLoadKg(props.e1rm));
  }, [props.e1rm, props.initialWeight, props.visible]);
  return { bar, oneRm, setBar, setOneRm, setWeight, weight };
}

function BarPicker(props: {
  bar: (typeof BARS)[number];
  onChange: (bar: (typeof BARS)[number]) => void;
  t: TFunction;
}): React.JSX.Element {
  return (
    <View style={styles.row}>
      {BARS.map((bar) => (
        <Pressable
          accessibilityRole={'button'}
          key={bar}
          onPress={() => props.onChange(bar)}
          style={[styles.chip, props.bar === bar && styles.chipOn]}
        >
          <Text style={styles.chipText}>
            {props.t(bar === 20 ? 'mobile.client.session.bar20' : 'mobile.client.session.bar15')}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function PlateList(props: { load: PlateLoad; t: TFunction }): React.JSX.Element {
  const groups = groupPlates(props.load.plates);
  return (
    <View style={styles.plates}>
      {props.load.barExceeds ? <Text style={styles.hint}>{props.t('mobile.client.session.barHeavier')}</Text> : null}
      {groups.length === 0 && !props.load.barExceeds ? (
        <Text style={styles.hint}>{props.t('mobile.client.session.platesEmpty')}</Text>
      ) : null}
      {groups.map((group) => (
        <Text key={group.kg} style={styles.plate}>
          {props.t('mobile.client.session.plateLine', { count: group.count, kg: group.kg })}
        </Text>
      ))}
      {props.load.remainderKg > 0 ? (
        <Text style={styles.hint}>{props.t('mobile.client.session.remainder', { kg: props.load.remainderKg })}</Text>
      ) : null}
    </View>
  );
}

function RpeList(props: {
  oneRm: number | null;
  onPick: (weight: string) => void;
  reps: number;
  t: TFunction;
}): React.JSX.Element | null {
  if (props.oneRm == null) return null;
  return (
    <View style={styles.rpe}>
      {RPE_STEPS.map((rpe) => {
        const weight = weightForRpe(props.oneRm ?? 0, props.reps, rpe);
        if (weight == null) return null;
        const label = props.t('mobile.client.session.rpeWeight', { rpe, weight: formatLoadKg(weight) });
        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole={'button'}
            key={rpe}
            onPress={() => props.onPick(formatLoadKg(weight))}
            style={styles.rpeRow}
          >
            <Text style={styles.plate}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function parseKg(raw: string): number | null {
  const value = Number(raw.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: LIGHT.overlay, flex: 1, justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: LIGHT.bgCard, borderRadius: LIGHT.radiusLg, maxHeight: '80%', padding: 16, width: '100%' },
  title: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: LIGHT.bgSoft, borderRadius: LIGHT.radiusFull, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: LIGHT.accentSoft },
  chipText: { color: LIGHT.textStrong, fontWeight: '700' },
  plates: { gap: 4, marginBottom: 12 },
  plate: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '700' },
  hint: { color: LIGHT.textMuted, fontSize: 13 },
  label: { color: LIGHT.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  input: {
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    color: LIGHT.textStrong,
    marginBottom: 12,
    padding: 10,
  },
  rpe: { gap: 6, marginBottom: 12 },
  rpeRow: { backgroundColor: LIGHT.bgSoft, borderRadius: LIGHT.radiusMd, padding: 10 },
  use: { alignItems: 'center', backgroundColor: LIGHT.accent, borderRadius: LIGHT.radiusMd, marginBottom: 8, padding: 12 },
  useText: { color: LIGHT.textOnNavy, fontWeight: '700' },
  close: { alignItems: 'center', padding: 8 },
  closeText: { color: LIGHT.accentDark, fontWeight: '700' },
});

import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { FieldModeValue } from './FieldModeControl';

export type SetRange = {
  maxKg: string;
  minKg: string;
};

export type GlobalPrescription = {
  repsMax: string;
  repsMin: string;
  restSeconds: string;
  setsPlanned: string;
  targetRir: string;
  targetRpe: string;
};

type Props = {
  addLabel: string;
  globalModes: Record<keyof GlobalPrescription, FieldModeValue>;
  globalValues: GlobalPrescription;
  labels: {
    repsMax: string;
    repsMin: string;
    restSeconds: string;
    setsPlanned: string;
    targetRir: string;
    targetRpe: string;
  };
  maxLabel: string;
  minLabel: string;
  onAddSet: () => void;
  onChangeGlobalMode: (field: keyof GlobalPrescription, mode: FieldModeValue) => void;
  onChangeGlobalValue: (field: keyof GlobalPrescription, value: string) => void;
  onChangeRange: (index: number, next: SetRange) => void;
  ranges: SetRange[];
  removeLabel: string;
};

const COLORS = {
  border: '#d8e1ee',
  danger: '#c1372f',
  muted: '#5f7288',
  text: '#11213a',
};

export function SetPrescriptionEditor(props: Props): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.globalSection}>
        <GlobalSetRow1 {...props} />
        <GlobalSetRow2 {...props} />
      </View>
      <View style={styles.divider} />
      {props.ranges.map((range, index) => {
        const onMin = (v: string) => props.onChangeRange(index, { ...range, minKg: v });
        const onMax = (v: string) => props.onChangeRange(index, { ...range, maxKg: v });
        const onRm = () => props.onChangeRange(index, { maxKg: '', minKg: '' });
        return (
          <View key={index} style={styles.row}>
            <Field label={props.minLabel} onChange={onMin} value={range.minKg} />
            <Field label={props.maxLabel} onChange={onMax} value={range.maxKg} />
            <Pressable onPress={onRm}>
              <Text style={styles.remove}>{props.removeLabel}</Text>
            </Pressable>
          </View>
        );
      })}
      <Pressable onPress={props.onAddSet} style={styles.add}>
        <Text style={styles.addLabel}>{props.addLabel}</Text>
      </Pressable>
    </View>
  );
}

function GlobalSetRow1(props: Props) {
  return (
    <View style={styles.row}>
      <ModeField
        label={props.labels.setsPlanned}
        mode={props.globalModes.setsPlanned}
        onChangeMode={(mode) => props.onChangeGlobalMode('setsPlanned', mode)}
        onChangeValue={(value) => props.onChangeGlobalValue('setsPlanned', value)}
        value={props.globalValues.setsPlanned}
      />
      <ModeField
        label={props.labels.repsMin}
        mode={props.globalModes.repsMin}
        onChangeMode={(mode) => props.onChangeGlobalMode('repsMin', mode)}
        onChangeValue={(value) => props.onChangeGlobalValue('repsMin', value)}
        value={props.globalValues.repsMin}
      />
      <ModeField
        label={props.labels.repsMax}
        mode={props.globalModes.repsMax}
        onChangeMode={(mode) => props.onChangeGlobalMode('repsMax', mode)}
        onChangeValue={(value) => props.onChangeGlobalValue('repsMax', value)}
        value={props.globalValues.repsMax}
      />
    </View>
  );
}

function GlobalSetRow2(props: Props) {
  return (
    <View style={styles.row}>
      <ModeField
        label={props.labels.restSeconds}
        mode={props.globalModes.restSeconds}
        onChangeMode={(mode) => props.onChangeGlobalMode('restSeconds', mode)}
        onChangeValue={(value) => props.onChangeGlobalValue('restSeconds', value)}
        value={props.globalValues.restSeconds}
      />
      <ModeField
        label={props.labels.targetRpe}
        mode={props.globalModes.targetRpe}
        onChangeMode={(mode) => props.onChangeGlobalMode('targetRpe', mode)}
        onChangeValue={(value) => props.onChangeGlobalValue('targetRpe', value)}
        value={props.globalValues.targetRpe}
      />
      <ModeField
        label={props.labels.targetRir}
        mode={props.globalModes.targetRir}
        onChangeMode={(mode) => props.onChangeGlobalMode('targetRir', mode)}
        onChangeValue={(value) => props.onChangeGlobalValue('targetRir', value)}
        value={props.globalValues.targetRir}
      />
    </View>
  );
}

type ModeFieldProps = {
  label: string;
  mode: FieldModeValue;
  onChangeMode: (mode: FieldModeValue) => void;
  onChangeValue: (value: string) => void;
  value: string;
};
function ModeField(props: ModeFieldProps) {
  const isHidden = props.mode === 'HIDDEN';
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel} numberOfLines={1}>
        {props.label}
      </Text>
      <View style={styles.inputContainer}>
        <TextInput
          keyboardType="numeric"
          onChangeText={props.onChangeValue}
          style={[styles.input, styles.modeInput, isHidden && styles.inputHidden]}
          value={props.value}
        />
        <ModeFieldIcons isHidden={isHidden} mode={props.mode} onChangeMode={props.onChangeMode} />
      </View>
    </View>
  );
}

type ModeFieldIconsProps = {
  isHidden: boolean;
  mode: FieldModeValue;
  onChangeMode: (mode: FieldModeValue) => void;
};
function ModeFieldIcons({ isHidden, mode, onChangeMode }: ModeFieldIconsProps) {
  const isLocked = mode === 'COACH_INPUT'; // Coach = Lock, Client = Unlock
  const toggleVisibility = () => onChangeMode(isHidden ? 'CLIENT_INPUT' : 'HIDDEN');
  const toggleLock = () => {
    if (isHidden) return; // Hidden overrides lock completely
    onChangeMode(isLocked ? 'CLIENT_INPUT' : 'COACH_INPUT');
  };
  return (
    <View style={styles.iconsContainer}>
      <Pressable onPress={toggleVisibility} style={styles.iconButton}>
        <Text style={[styles.iconText, isHidden && styles.iconHidden]}>👁</Text>
      </Pressable>
      {!isHidden && (
        <Pressable onPress={toggleLock} style={styles.iconButton}>
          <Text style={styles.iconText}>{isLocked ? '🔒' : '🔓'}</Text>
        </Pressable>
      )}
    </View>
  );
}

function Field(props: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        keyboardType="numeric"
        onChangeText={props.onChange}
        style={styles.input}
        value={props.value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  add: {
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 140,
  },
  addLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    gap: 16,
  },
  divider: {
    backgroundColor: COLORS.border,
    height: 1,
    marginTop: 4,
    width: '100%',
  },
  field: {
    flex: 1,
    gap: 4,
    minWidth: 80,
  },
  fieldLabel: {
    color: COLORS.muted,
    fontSize: 11,
  },
  globalSection: {
    gap: 12,
  },
  iconButton: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  iconHidden: {
    opacity: 0.3,
  },
  iconText: {
    fontSize: 14,
  },
  iconsContainer: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    gap: 2,
    paddingRight: 6,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  input: {
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inputContainer: {
    justifyContent: 'center',
    position: 'relative',
  },
  inputHidden: {
    backgroundColor: '#f8fafc',
    color: COLORS.muted,
  },
  modeInput: {
    paddingRight: 55, // Space for the two inline icons
  },
  remove: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
});

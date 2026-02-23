import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { FieldModeValue } from '../FieldModeControl';

export type CardioIntervalDraft = {
  displayName: string;
  distanceMode: FieldModeValue;
  restSeconds: string;
  roundsPlanned: string;
  rpeMode: FieldModeValue;
  targetDistanceMeters: string;
  targetRpe: string;
  workSeconds: string;
};

type Props = {
  addLabel: string;
  distanceLabel: string;
  emptyLabel: string;
  intervals: CardioIntervalDraft[];
  // Keeping for signature compatibility if needed elsewhere
  modeOptions: { label: string; value: FieldModeValue }[];
  onAddInterval: () => void;
  onChangeInterval: (index: number, next: CardioIntervalDraft) => void;
  removeLabel: string;
  restLabel: string;
  roundsLabel: string;
  rpeLabel: string;
  workLabel: string;
};

const COLORS = {
  border: '#d8e1ee',
  danger: '#c1372f',
  muted: '#5f7288',
  text: '#11213a',
};

export function CardioIntervalEditor(props: Props): React.JSX.Element {
  if (props.intervals.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.empty}>{props.emptyLabel}</Text>
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      {props.intervals.map((item, index) => (
        <IntervalCard
          key={index}
          addLabel={props.addLabel}
          distanceLabel={props.distanceLabel}
          interval={item}
          onChange={(next) => props.onChangeInterval(index, next)}
          removeLabel={props.removeLabel}
          restLabel={props.restLabel}
          roundsLabel={props.roundsLabel}
          rpeLabel={props.rpeLabel}
          workLabel={props.workLabel}
        />
      ))}
      <AddButton label={props.addLabel} onPress={props.onAddInterval} />
    </View>
  );
}

type IntervalCardProps = {
  addLabel: string;
  distanceLabel: string;
  interval: CardioIntervalDraft;
  onChange: (next: CardioIntervalDraft) => void;
  removeLabel: string;
  restLabel: string;
  roundsLabel: string;
  rpeLabel: string;
  workLabel: string;
};

function IntervalCard(props: IntervalCardProps) {
  return (
    <View style={styles.card}>
      <TextInput
        onChangeText={(value) => props.onChange({ ...props.interval, displayName: value })}
        placeholder={props.addLabel}
        style={styles.input}
        value={props.interval.displayName}
      />
      <MainNumericRow {...props} />
      <TargetsRow {...props} />
      <ClearButton
        interval={props.interval}
        onChange={props.onChange}
        removeLabel={props.removeLabel}
      />
    </View>
  );
}

function MainNumericRow(props: IntervalCardProps) {
  return (
    <View style={styles.row}>
      <Field
        label={props.roundsLabel}
        onChange={(value) => props.onChange({ ...props.interval, roundsPlanned: value })}
        value={props.interval.roundsPlanned}
      />
      <Field
        label={props.workLabel}
        onChange={(value) => props.onChange({ ...props.interval, workSeconds: value })}
        value={props.interval.workSeconds}
      />
      <Field
        label={props.restLabel}
        onChange={(value) => props.onChange({ ...props.interval, restSeconds: value })}
        value={props.interval.restSeconds}
      />
    </View>
  );
}

function TargetsRow(props: IntervalCardProps) {
  const i = props.interval;
  const set = props.onChange;

  const onDist = (v: string) => set({ ...i, targetDistanceMeters: v });
  const onDistMode = (m: FieldModeValue) => set({ ...i, distanceMode: m });
  const onRpe = (v: string) => set({ ...i, targetRpe: v });
  const onRpeMode = (m: FieldModeValue) => set({ ...i, rpeMode: m });

  return (
    <View style={styles.row}>
      <ModeField
        label={props.distanceLabel}
        mode={i.distanceMode}
        onChangeMode={onDistMode}
        onChangeValue={onDist}
        value={i.targetDistanceMeters}
      />
      <ModeField
        label={props.rpeLabel}
        mode={i.rpeMode}
        onChangeMode={onRpeMode}
        onChangeValue={onRpe}
        value={i.targetRpe}
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
      <Text style={styles.label}>{props.label}</Text>
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

function ClearButton(props: {
  interval: CardioIntervalDraft;
  onChange: (next: CardioIntervalDraft) => void;
  removeLabel: string;
}) {
  return (
    <Pressable onPress={() => props.onChange(buildClearedInterval(props.interval))}>
      <Text style={styles.remove}>{props.removeLabel}</Text>
    </Pressable>
  );
}

function buildClearedInterval(interval: CardioIntervalDraft): CardioIntervalDraft {
  return {
    ...interval,
    displayName: '',
    restSeconds: '',
    roundsPlanned: '',
    targetDistanceMeters: '',
    targetRpe: '',
    workSeconds: '',
  };
}

function Field(props: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        keyboardType="numeric"
        onChangeText={props.onChange}
        style={styles.input}
        value={props.value}
      />
    </View>
  );
}

function AddButton(props: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={styles.add}>
      <Text style={styles.addLabel}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  add: {
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 180,
  },
  addLabel: { color: COLORS.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  card: { borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, gap: 10, padding: 10 },
  empty: { color: COLORS.muted, fontSize: 13 },
  field: { flex: 1, gap: 4, minWidth: 90 },
  iconButton: { alignItems: 'center', height: 24, justifyContent: 'center', width: 24 },
  iconHidden: { opacity: 0.3 },
  iconText: { fontSize: 14 },
  iconsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    paddingRight: 6,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  input: {
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inputContainer: { position: 'relative', justifyContent: 'center' },
  inputHidden: { backgroundColor: '#f8fafc', color: COLORS.muted },
  label: { color: COLORS.muted, fontSize: 12 },
  modeInput: { paddingRight: 60 },
  remove: { color: COLORS.danger, fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  wrap: { gap: 10 },
});

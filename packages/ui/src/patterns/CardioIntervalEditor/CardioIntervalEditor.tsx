import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FieldModeControl, type FieldModeValue } from '../FieldModeControl';

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
        <AddButton label={props.addLabel} onPress={props.onAddInterval} />
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
          modeOptions={props.modeOptions}
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
  modeOptions: { label: string; value: FieldModeValue }[];
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
      <ModesRow {...props} />
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
  return (
    <View style={styles.row}>
      <Field
        label={props.distanceLabel}
        onChange={(value) => props.onChange({ ...props.interval, targetDistanceMeters: value })}
        value={props.interval.targetDistanceMeters}
      />
      <Field
        label={props.rpeLabel}
        onChange={(value) => props.onChange({ ...props.interval, targetRpe: value })}
        value={props.interval.targetRpe}
      />
    </View>
  );
}

function ModesRow(props: IntervalCardProps) {
  return (
    <View style={styles.row}>
      <ModeControl
        mode={props.interval.distanceMode}
        modeOptions={props.modeOptions}
        onChange={(mode) => props.onChange({ ...props.interval, distanceMode: mode })}
      />
      <ModeControl
        mode={props.interval.rpeMode}
        modeOptions={props.modeOptions}
        onChange={(mode) => props.onChange({ ...props.interval, rpeMode: mode })}
      />
    </View>
  );
}

function ModeControl(props: {
  mode: FieldModeValue;
  modeOptions: { label: string; value: FieldModeValue }[];
  onChange: (mode: FieldModeValue) => void;
}) {
  return (
    <View style={styles.mode}>
      <FieldModeControl onChange={props.onChange} options={props.modeOptions} value={props.mode} />
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
  addLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    padding: 10,
  },
  empty: {
    color: COLORS.muted,
    fontSize: 13,
  },
  field: {
    flex: 1,
    gap: 4,
    minWidth: 90,
  },
  input: {
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  label: {
    color: COLORS.muted,
    fontSize: 12,
  },
  mode: {
    flex: 1,
  },
  remove: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  wrap: {
    gap: 10,
  },
});

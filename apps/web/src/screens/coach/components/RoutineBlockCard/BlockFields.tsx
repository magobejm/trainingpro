import React from 'react';
import { Text, TextInput, View } from 'react-native';
import type { DraftBlock } from '../../RoutinePlanner.types';
import { RoutineNumberField } from '../RoutineNumberField';
import { s } from '../../RoutinePlanner.styles';

interface BlockFieldsProps {
  block: DraftBlock;
  readOnly: boolean;
  onUpdateField: (f: keyof DraftBlock, v: unknown) => void;
  t: (k: string) => string;
}

export function BlockFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  if (block.type === 'strength') {
    return <StrengthFields block={block} onUpdateField={onUpdateField} readOnly={readOnly} t={t} />;
  }
  if (block.type === 'cardio') {
    return <CardioFields block={block} onUpdateField={onUpdateField} readOnly={readOnly} t={t} />;
  }
  if (block.type === 'plio') {
    return <PlioFields block={block} onUpdateField={onUpdateField} readOnly={readOnly} t={t} />;
  }
  if (block.type === 'warmup') {
    return <MobilityFields block={block} onUpdateField={onUpdateField} readOnly={readOnly} t={t} />;
  }
  return (
    <RoutineNumberField
      label={t('coach.routine.block.duration')}
      onChange={(v) => onUpdateField('durationMinutes', v)}
      readOnly={readOnly}
      value={block.durationMinutes}
    />
  );
}

function StrengthFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  const n = numberField(block, onUpdateField, readOnly, t);
  const x = textField(block, onUpdateField, readOnly, t);
  return (
    <>
      {n('coach.routine.block.sets', 'setsPlanned')}
      {x('coach.routine.block.repsRange', 'repsRange')}
      {n('coach.routine.block.rest', 'restSeconds')}
      {n('coach.routine.block.rpe', 'targetRpe')}
      {n('coach.routine.block.rir', 'targetRir')}
      {x('coach.routine.block.repsBySeries', 'repsPerSeries')}
      {x('coach.routine.block.weightBySeries', 'weightPerSeriesKg')}
    </>
  );
}

function CardioFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  const n = numberField(block, onUpdateField, readOnly, t);
  const x = textField(block, onUpdateField, readOnly, t);
  return (
    <>
      {n('coach.routine.block.sets', 'roundsPlanned')}
      {x('coach.routine.block.workText', 'cardioWorkText')}
      {n('coach.routine.block.rest', 'restSeconds')}
      {n('coach.routine.block.intensityFcmax', 'intensityFcMax')}
      {n('coach.routine.block.intensityFcreserva', 'intensityFcReserve')}
      {n('coach.routine.block.heartRate', 'heartRate')}
      {n('coach.routine.block.rpe', 'targetRpe')}
      {n('coach.routine.block.totalTime', 'totalTimeSeconds')}
    </>
  );
}

function PlioFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  const n = numberField(block, onUpdateField, readOnly, t);
  const x = textField(block, onUpdateField, readOnly, t);
  return (
    <>
      {n('coach.routine.block.sets', 'roundsPlanned')}
      {x('coach.routine.block.repsRange', 'repsRange')}
      {n('coach.routine.block.rpe', 'targetRpe')}
      {n('coach.routine.block.reps', 'repsPlanned')}
      {n('coach.routine.block.weightKg', 'weightKg')}
      {n('coach.routine.block.rest', 'restSeconds')}
    </>
  );
}

function MobilityFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  const n = numberField(block, onUpdateField, readOnly, t);
  const x = textField(block, onUpdateField, readOnly, t);
  return (
    <>
      {n('coach.routine.block.sets', 'roundsPlanned')}
      {x('coach.routine.block.repsRange', 'repsRange')}
      {n('coach.routine.block.reps', 'repsPlanned')}
      {n('coach.routine.block.rpe', 'targetRpe')}
      {n('coach.routine.block.rest', 'restSeconds')}
    </>
  );
}

function numberField(
  block: DraftBlock,
  onUpdateField: (f: keyof DraftBlock, v: unknown) => void,
  readOnly: boolean,
  t: (k: string) => string,
) {
  return (labelKey: string, field: keyof DraftBlock) => (
    <RoutineNumberField
      label={t(labelKey)}
      onChange={(v) => onUpdateField(field, v)}
      readOnly={readOnly}
      value={block[field] as number | undefined}
    />
  );
}

function textField(
  block: DraftBlock,
  onUpdateField: (f: keyof DraftBlock, v: unknown) => void,
  readOnly: boolean,
  t: (k: string) => string,
) {
  const onTextChange = buildTextUpdater(onUpdateField);
  return (labelKey: string, field: keyof DraftBlock) => (
    <TextField
      label={t(labelKey)}
      onChange={(v) => onTextChange(field, v)}
      readOnly={readOnly}
      value={(block[field] as string | undefined) ?? ''}
    />
  );
}

function buildTextUpdater(onUpdateField: (f: keyof DraftBlock, v: unknown) => void) {
  return (field: keyof DraftBlock, value: string) => {
    if (field === 'repsRange' && !isValidRepsRangeInput(value)) {
      return;
    }
    onUpdateField(field, value);
  };
}

function isValidRepsRangeInput(value: string): boolean {
  const raw = value.trim();
  if (!raw) {
    return true;
  }
  return /^\d+(\s*-\s*\d*)?$/.test(raw);
}

function TextField(props: {
  label: string;
  onChange: (v: string) => void;
  readOnly: boolean;
  value?: string;
}) {
  return (
    <View style={s.numberField}>
      <Text style={s.numberLabel}>{props.label}</Text>
      <TextInput
        editable={!props.readOnly}
        onChangeText={props.onChange}
        placeholder={props.label}
        style={styles.textInput}
        value={props.value ?? ''}
      />
    </View>
  );
}

const styles = {
  textInput: {
    ...s.numberInput,
    minWidth: 180,
    textAlign: 'left' as const,
  },
};

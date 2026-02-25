import React from 'react';
import type { DraftBlock } from '../../RoutinePlanner.types';
import { RoutineNumberField } from '../RoutineNumberField';

interface BlockFieldsProps {
  block: DraftBlock;
  readOnly: boolean;
  onUpdateField: (f: keyof DraftBlock, v: unknown) => void;
  t: (k: string) => string;
}

export function BlockFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  const isStrength = block.type === 'strength';
  const isSport = block.type === 'sport';
  const isTimed = ['cardio', 'plio', 'warmup'].includes(block.type);

  return (
    <>
      {isStrength && (
        <StrengthFields block={block} onUpdateField={onUpdateField} readOnly={readOnly} t={t} />
      )}
      {isTimed && (
        <TimedFields block={block} onUpdateField={onUpdateField} readOnly={readOnly} t={t} />
      )}
      {isSport && (
        <SportFields block={block} onUpdateField={onUpdateField} readOnly={readOnly} t={t} />
      )}
      {!isSport && (
        <RestField block={block} onUpdateField={onUpdateField} readOnly={readOnly} t={t} />
      )}
      <RoutineNumberField
        label={t('coach.routine.block.rpe')}
        onChange={(v) => onUpdateField('targetRpe', v)}
        readOnly={readOnly}
        value={block.targetRpe}
      />
    </>
  );
}

function StrengthFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  return (
    <>
      <RoutineNumberField
        label={t('coach.routine.block.sets')}
        onChange={(v) => onUpdateField('setsPlanned', v)}
        readOnly={readOnly}
        value={block.setsPlanned}
      />
      <RoutineNumberField
        label={t('coach.routine.block.reps')}
        onChange={(v) => onUpdateField('repsPlanned', v)}
        readOnly={readOnly}
        value={block.repsPlanned}
      />
      <RoutineNumberField
        label={t('coach.routine.block.rir')}
        onChange={(v) => onUpdateField('targetRir', v)}
        readOnly={readOnly}
        value={block.targetRir}
      />
    </>
  );
}

function TimedFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  return (
    <>
      <RoutineNumberField
        label={t('coach.routine.block.rounds')}
        onChange={(v) => onUpdateField('roundsPlanned', v)}
        readOnly={readOnly}
        value={block.roundsPlanned}
      />
      <RoutineNumberField
        label={t('coach.routine.block.work')}
        onChange={(v) => onUpdateField('workSeconds', v)}
        readOnly={readOnly}
        value={block.workSeconds}
      />
    </>
  );
}

function SportFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  return (
    <RoutineNumberField
      label={t('coach.routine.block.duration')}
      onChange={(v) => onUpdateField('durationMinutes', v)}
      readOnly={readOnly}
      value={block.durationMinutes}
    />
  );
}

function RestField({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  return (
    <RoutineNumberField
      label={t('coach.routine.block.rest')}
      onChange={(v) => onUpdateField('restSeconds', v)}
      readOnly={readOnly}
      value={block.restSeconds}
    />
  );
}

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  canUnlockSetVariable,
  COACH_LIBRARY_IDS,
  resolveLockedFields,
  setVariablesForType,
  type CoachBlockKind,
} from '@trainerpro/shared';
import { CoachButton, CoachField, CoachPage, CoachSelect, ui } from './CoachUi';
import { CoachLibraryScreen } from './CoachLibraryScreen';
import type { PlanRecord } from './coach-plan-model';
const blockNumbers: Record<CoachBlockKind, string[]> = {
  strength: [
    'setsPlanned',
    'repsMin',
    'repsMax',
    'restSeconds',
    'targetRpe',
    'targetRir',
    'weightRangeMinKg',
    'weightRangeMaxKg',
  ],
  cardio: ['roundsPlanned', 'workSeconds', 'restSeconds', 'targetDistanceMeters', 'targetRpe'],
  isometric: ['setsPlanned', 'targetRpe'],
  plio: ['roundsPlanned', 'workSeconds', 'restSeconds', 'targetRpe'],
  mobility: ['roundsPlanned', 'workSeconds', 'restSeconds', 'targetRpe'],
  sport: ['durationMinutes', 'targetRpe'],
};
export function CoachPlanBlockEditor({
  kind,
  value,
  onChange,
  onBack,
  groups,
  warmup = false,
}: {
  kind: CoachBlockKind;
  value: PlanRecord;
  onChange: (next: PlanRecord) => void;
  onBack: () => void;
  groups: PlanRecord[];
  warmup?: boolean;
}) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);
  const set = (field: string, next: unknown) => onChange({ ...value, [field]: next });
  if (picking)
    return (
      <CoachLibraryScreen
        initialCategory={kind}
        onBack={() => setPicking(false)}
        onPick={(item) => {
          onChange({ ...value, displayName: item.name, [COACH_LIBRARY_IDS[kind]]: item.id });
          setPicking(false);
        }}
      />
    );
  return (
    <CoachPage title={t('coachWorkspace.block.' + kind)} onBack={onBack}>
      <CoachField
        label={t('coachWorkspace.field.displayName')}
        value={String(value.displayName ?? '')}
        onChange={(next) => set('displayName', next)}
      />
      <CoachButton label={t('coachWorkspace.chooseExercise')} onPress={() => setPicking(true)} />
      <CoachField
        label={t('coachWorkspace.field.notes')}
        value={String(value.notes ?? '')}
        onChange={(next) => set('notes', next)}
        multiline
      />
      {kind === 'cardio' && !warmup ? (
        <CoachField
          label={t('coachWorkspace.field.methodType')}
          value={String(value.methodType ?? 'continuo')}
          onChange={(next) => set('methodType', next)}
        />
      ) : null}
      {blockNumbers[kind]
        .filter((field) => !warmup || !['weightRangeMinKg', 'weightRangeMaxKg', 'targetDistanceMeters'].includes(field))
        .map((field) => (
          <CoachField
            key={field}
            label={t('coachWorkspace.field.' + field)}
            value={String(value[field] ?? '')}
            onChange={(next) => set(field, next === '' ? null : Number(next.replace(',', '.')))}
            numeric
          />
        ))}
      <CoachSelect
        label={t('coachWorkspace.group')}
        value={String(value.groupId ?? '')}
        onChange={(next) => set('groupId', next || null)}
        options={[
          { value: '', label: t('coachWorkspace.none') },
          ...groups.map((g) => ({
            value: String(g.clientId ?? g.id),
            label: String(g.groupType) + ' · ' + String(g.note ?? ''),
          })),
        ]}
      />
      <BlockVariables kind={kind} value={value} onChange={onChange} warmup={warmup} />
      {kind === 'strength' && !warmup ? <BlockWeightRanges value={value} onChange={onChange} /> : null}
      <BlockSets kind={kind} value={value} onChange={onChange} />
      <CoachButton label={t('coachWorkspace.done')} onPress={onBack} />
    </CoachPage>
  );
}
function BlockWeightRanges({ value, onChange }: { value: PlanRecord; onChange: (next: PlanRecord) => void }) {
  const { t } = useTranslation();
  const ranges = (value.perSetWeightRanges as PlanRecord[]) ?? [];
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{t('coachWorkspace.weightRanges')}</Text>
      {ranges.map((range, index) => (
        <View key={index} style={ui.field}>
          {['minKg', 'maxKg'].map((key) => (
            <CoachField
              key={key}
              label={t('coachWorkspace.field.' + key)}
              value={String(range[key] ?? '')}
              numeric
              onChange={(next) =>
                onChange({
                  ...value,
                  perSetWeightRanges: ranges.map((old, i) =>
                    i === index ? { ...old, [key]: next === '' ? null : Number(next.replace(',', '.')) } : old,
                  ),
                })
              }
            />
          ))}
          <CoachButton
            label={t('coachWorkspace.delete')}
            onPress={() => onChange({ ...value, perSetWeightRanges: ranges.filter((_, i) => i !== index) })}
            danger
          />
        </View>
      ))}
      <CoachButton
        label={t('coachWorkspace.addSet')}
        disabled={ranges.length >= 30}
        onPress={() => onChange({ ...value, perSetWeightRanges: [...ranges, { minKg: null, maxKg: null }] })}
      />
    </View>
  );
}
function BlockVariables({
  kind,
  value,
  onChange,
  warmup = false,
}: {
  kind: CoachBlockKind;
  value: PlanRecord;
  onChange: (next: PlanRecord) => void;
  warmup?: boolean;
}) {
  const { t } = useTranslation();
  const locked = resolveLockedFields(kind, value.lockedFields as string[] | undefined);
  const modes = (value.fieldModes as { fieldKey: string; mode: string }[]) ?? [];
  const setMode = (fieldKey: string, mode: string) =>
    onChange({ ...value, fieldModes: [...modes.filter((m) => m.fieldKey !== fieldKey), { fieldKey, mode }] });
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{t('coachWorkspace.variables')}</Text>
      {setVariablesForType(kind).map((key) => (
        <View key={key} style={ui.field}>
          {!warmup ? (
            <CoachSelect
              label={t('coachWorkspace.field.' + key)}
              value={modes.find((m) => m.fieldKey === key)?.mode ?? 'COACH_INPUT'}
              onChange={(mode) => setMode(key, mode)}
              options={['COACH_INPUT', 'CLIENT_INPUT', 'HIDDEN'].map((mode) => ({
                value: mode,
                label: t('coachWorkspace.mode.' + mode),
              }))}
            />
          ) : (
            <Text style={ui.label}>{t('coachWorkspace.field.' + key)}</Text>
          )}
          <CoachButton
            label={t(locked.includes(key) ? 'coachWorkspace.unlock' : 'coachWorkspace.lock')}
            disabled={locked.includes(key) && !canUnlockSetVariable(kind, locked, key)}
            onPress={() =>
              onChange({
                ...value,
                lockedFields: locked.includes(key) ? locked.filter((field) => field !== key) : [...locked, key],
              })
            }
          />
        </View>
      ))}
    </View>
  );
}
function BlockSets({
  kind,
  value,
  onChange,
}: {
  kind: CoachBlockKind;
  value: PlanRecord;
  onChange: (next: PlanRecord) => void;
}) {
  const { t } = useTranslation();
  const sets = (value.sets as PlanRecord[]) ?? [];
  const update = (index: number, key: string, next: unknown) =>
    onChange({ ...value, sets: sets.map((set, i) => (i === index ? { ...set, [key]: next } : set)) });
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{t('coachWorkspace.sets')}</Text>
      {sets.map((set, index) => (
        <View key={index} style={ui.card}>
          <Text style={ui.label}>
            {t('coachWorkspace.set')} {index + 1}
          </Text>
          {setVariablesForType(kind).map((field) => (
            <CoachField
              key={field}
              label={t('coachWorkspace.field.' + field)}
              value={String(set[field] ?? '')}
              onChange={(next) =>
                update(index, field, field === 'rom' ? next : next === '' ? null : Number(next.replace(',', '.')))
              }
              numeric={field !== 'rom'}
            />
          ))}
          <CoachSelect
            label={t('coachWorkspace.technique')}
            value={String(set.advancedTechnique ?? '')}
            onChange={(next) => update(index, 'advancedTechnique', next || null)}
            options={['', 'topSet', 'backOffSet', 'clusterSets', 'myoReps', 'dropSet'].map((technique) => ({
              value: technique,
              label: technique || t('coachWorkspace.none'),
            }))}
          />
          <CoachField
            label={t('coachWorkspace.field.note')}
            value={String(set.note ?? '')}
            onChange={(next) => update(index, 'note', next)}
            multiline
          />
          <CoachButton
            label={t('coachWorkspace.duplicate')}
            onPress={() => onChange({ ...value, sets: [...sets, { ...set, setIndex: sets.length }] })}
          />
          <CoachButton
            label={t('coachWorkspace.delete')}
            onPress={() =>
              onChange({ ...value, sets: sets.filter((_, i) => i !== index).map((item, i) => ({ ...item, setIndex: i })) })
            }
            danger
          />
        </View>
      ))}
      <CoachButton
        label={t('coachWorkspace.addSet')}
        disabled={sets.length >= 30}
        onPress={() => onChange({ ...value, sets: [...sets, { setIndex: sets.length }] })}
      />
    </View>
  );
}

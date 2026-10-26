import React, { useContext, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ProgressionMicrocycle, ProgressionRule } from '@trainerpro/shared';
import { TextField, colors, fontSize, radius, space } from '@trainerpro/ui';
import type { DraftBlock } from '../../RoutinePlanner.types';
import {
  buildPreset,
  fitMicrocycles,
  previewRows,
  type PreviewRow,
  type ProgressionPreset,
} from '../../progression-presets';
import { ProgressionContext, type ProgressionContextValue } from './ProgressionContext';

type T = (key: string, options?: Record<string, unknown>) => string;
type Props = {
  block: DraftBlock;
  onUpdateField: (field: keyof DraftBlock, value: unknown) => void;
  readOnly: boolean;
  t: T;
};

const DEFAULT_AUTO_LOAD = { incrementKg: 2.5, rirAtOrAbove: 2, whenRepsAtTop: true };

export function ProgressionPanel(props: Props): React.JSX.Element | null {
  const context = useContext(ProgressionContext);
  if (!context || props.block.type !== 'strength') return null;
  return <ProgressionEditor {...props} {...context} />;
}

function ProgressionEditor(props: Props & ProgressionContextValue): React.JSX.Element {
  const { mesocycleMicrocycles, microcycleDays } = props;
  const [open, setOpen] = useState(Boolean(props.block.progressionRule));
  const { block, readOnly, t } = props;
  const count = mesocycleMicrocycles ?? 0;
  const rule: ProgressionRule = block.progressionRule ?? { microcycles: [] };
  const save = (next: ProgressionRule | null) => props.onUpdateField('progressionRule', next);
  const microcycles = fitMicrocycles(rule.microcycles, count);
  const update = (index: number, patch: Partial<ProgressionMicrocycle>) =>
    save({ ...rule, microcycles: microcycles.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  return (
    <View style={styles.panel}>
      <Pressable accessibilityRole="button" onPress={() => setOpen((value) => !value)} style={styles.header}>
        <Text style={styles.title}>{t('coach.routine.progression.title')}</Text>
        <Text style={styles.toggle}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open ? (
        count === 0 ? (
          <Text style={styles.hint}>{t('coach.routine.progression.needsMesocycle')}</Text>
        ) : (
          <View style={styles.body}>
            <Text style={styles.hint}>{t('coach.routine.progression.hint', { count, days: microcycleDays ?? 7 })}</Text>
            {readOnly ? null : (
              <PresetRow
                onClear={() => save(null)}
                onPick={(preset) => save({ ...rule, microcycles: buildPreset(preset, count) })}
                t={t}
              />
            )}
            <MicrocycleTable microcycles={microcycles} onChange={update} readOnly={readOnly} t={t} />
            <AutoLoadEditor
              onChange={(autoLoad) => save({ ...rule, autoLoad, microcycles })}
              readOnly={readOnly}
              rule={rule}
              t={t}
            />
            <Preview block={block} count={count} rule={{ ...rule, microcycles }} t={t} />
          </View>
        )
      ) : null}
    </View>
  );
}

function PresetRow(props: { onClear: () => void; onPick: (preset: ProgressionPreset) => void; t: T }): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Chip label={props.t('coach.routine.progression.presetLinear')} onPress={() => props.onPick('linear')} />
      <Chip label={props.t('coach.routine.progression.presetUndulating')} onPress={() => props.onPick('undulating')} />
      <Chip label={props.t('coach.routine.progression.clear')} onPress={props.onClear} />
    </View>
  );
}

function MicrocycleTable(props: {
  microcycles: ProgressionMicrocycle[];
  onChange: (index: number, patch: Partial<ProgressionMicrocycle>) => void;
  readOnly: boolean;
  t: T;
}): React.JSX.Element {
  const { t } = props;
  return (
    <View style={styles.table}>
      {props.microcycles.map((micro, index) => (
        <View key={index} style={styles.microRow}>
          <Text style={styles.microLabel}>{t('coach.routine.progression.microcycle', { index: index + 1 })}</Text>
          <NumberCell
            label={t('coach.routine.progression.setsDelta')}
            onChange={(value) => props.onChange(index, { setsDelta: value == null ? null : Math.round(value) })}
            readOnly={props.readOnly}
            value={micro.setsDelta}
          />
          <NumberCell
            label={t('coach.routine.progression.rir')}
            onChange={(value) => props.onChange(index, { rirTarget: value == null ? null : Math.round(value) })}
            readOnly={props.readOnly}
            value={micro.rirTarget}
          />
          <NumberCell
            label={t('coach.routine.progression.loadPct')}
            onChange={(value) => props.onChange(index, { loadPct: value == null ? null : value / 100 })}
            readOnly={props.readOnly}
            value={micro.loadPct == null ? null : Math.round(micro.loadPct * 100)}
          />
          <NumberCell
            label={t('coach.routine.progression.loadDeltaKg')}
            onChange={(value) => props.onChange(index, { loadDeltaKg: value })}
            readOnly={props.readOnly}
            value={micro.loadDeltaKg}
          />
          <Chip
            active={Boolean(micro.deload)}
            disabled={props.readOnly}
            label={t('coach.routine.progression.deload')}
            onPress={() => props.onChange(index, { deload: !micro.deload })}
          />
        </View>
      ))}
    </View>
  );
}

function AutoLoadEditor(props: {
  onChange: (autoLoad: ProgressionRule['autoLoad']) => void;
  readOnly: boolean;
  rule: ProgressionRule;
  t: T;
}): React.JSX.Element {
  const { t } = props;
  const auto = props.rule.autoLoad;
  return (
    <View style={styles.autoLoad}>
      <Chip
        active={Boolean(auto)}
        disabled={props.readOnly}
        label={t('coach.routine.progression.autoLoad')}
        onPress={() => props.onChange(auto ? null : DEFAULT_AUTO_LOAD)}
      />
      {auto ? (
        <View style={styles.row}>
          <NumberCell
            label={t('coach.routine.progression.incrementKg')}
            onChange={(value) => props.onChange({ ...auto, incrementKg: value && value > 0 ? value : auto.incrementKg })}
            readOnly={props.readOnly}
            value={auto.incrementKg}
          />
          <NumberCell
            label={t('coach.routine.progression.rirAtOrAbove')}
            onChange={(value) => props.onChange({ ...auto, rirAtOrAbove: Math.round(value ?? auto.rirAtOrAbove) })}
            readOnly={props.readOnly}
            value={auto.rirAtOrAbove}
          />
          <Chip
            active={auto.whenRepsAtTop}
            disabled={props.readOnly}
            label={t('coach.routine.progression.whenRepsAtTop')}
            onPress={() => props.onChange({ ...auto, whenRepsAtTop: !auto.whenRepsAtTop })}
          />
        </View>
      ) : null}
    </View>
  );
}

function Preview(props: { block: DraftBlock; count: number; rule: ProgressionRule; t: T }): React.JSX.Element {
  const rows = previewRows(props.block, props.rule, props.count);
  if (rows.length === 0) return <Text style={styles.hint}>{props.t('coach.routine.progression.previewEmpty')}</Text>;
  return (
    <View style={styles.preview}>
      <Text style={styles.previewTitle}>{props.t('coach.routine.progression.preview')}</Text>
      {rows.map((row, index) => (
        <Text key={index} style={styles.previewRow}>
          {`M${index + 1}: ${describe(row, props.t)}`}
        </Text>
      ))}
    </View>
  );
}

function describe(row: PreviewRow, t: T): string {
  const rir = row.rir == null ? '-' : String(row.rir);
  const weight = row.weightKg == null ? '' : ` · ${row.weightKg} kg`;
  return `${t('coach.routine.progression.previewSets', { count: row.sets })} @ RIR ${rir}${weight}`;
}

function NumberCell(props: {
  label: string;
  onChange: (value: null | number) => void;
  readOnly: boolean;
  value: null | number | undefined;
}): React.JSX.Element {
  const [raw, setRaw] = useState<null | string>(null);
  const commit = () => {
    if (raw === null) return;
    const parsed = Number(raw.replace(',', '.'));
    props.onChange(raw.trim() === '' || !Number.isFinite(parsed) ? null : parsed);
    setRaw(null);
  };
  return (
    <TextField
      containerStyle={styles.cell}
      disabled={props.readOnly}
      keyboardType={'numeric'}
      label={props.label}
      onBlur={commit}
      onChangeText={setRaw}
      value={raw ?? (props.value == null ? '' : String(props.value))}
    />
  );
}

function Chip(props: { active?: boolean; disabled?: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: props.disabled, selected: props.active }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={[styles.chip, props.active ? styles.chipOn : null]}
    >
      <Text style={[styles.chipText, props.active ? styles.chipTextOn : null]}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  autoLoad: { gap: space.sm },
  body: { gap: space.md },
  cell: { minWidth: 80, width: 80 },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: fontSize.sm },
  chipTextOn: { color: colors.onPrimary },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  hint: { color: colors.textMuted, fontSize: fontSize.xs },
  microLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', minWidth: 36 },
  microRow: { alignItems: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  panel: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.sm,
    padding: space.md,
  },
  preview: { gap: space.xs },
  previewRow: { color: colors.text, fontSize: fontSize.sm },
  previewTitle: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  row: { alignItems: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  table: { gap: space.sm },
  title: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  toggle: { color: colors.primary, fontSize: fontSize.sm },
});

import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SegmentedControl, colors, fontSize, radius, space } from '@trainerpro/ui';
import { COMMAND_VARIABLES, type CoachPresetItem, type CommandVariable } from '@trainerpro/shared';
import { canEnable, enabledCount, modesFor, type Drafts, type RuleDraft } from './progression-draft';

const KEYBOARD = 'decimal-pad' as const;
type Translate = (key: string, options?: Record<string, unknown>) => string;

type RowProps = {
  draft: RuleDraft;
  locked: boolean;
  onAddPreset: () => void;
  onChange: (patch: Partial<RuleDraft>) => void;
  onRemovePreset: (id: string) => void;
  presets: CoachPresetItem[];
  t: Translate;
  variable: CommandVariable;
};

function presetLabel(preset: CoachPresetItem): string {
  if (preset.mode === 'set') return `=${preset.value}`;
  const suffix = preset.mode === 'percent' ? '%' : '';
  return `${preset.value > 0 ? '+' : ''}${preset.value}${suffix}`;
}

function PresetChips(props: RowProps): React.JSX.Element {
  return (
    <View style={styles.presets}>
      {props.presets.map((preset) => (
        <Pressable
          accessibilityLabel={props.t('coach.clientRoutine.command.presetRemove')}
          key={preset.id}
          onLongPress={() => props.onRemovePreset(preset.id)}
          onPress={() => props.onChange({ mode: preset.mode, text: String(preset.value) })}
          style={styles.preset}
        >
          <Text style={styles.presetText}>{presetLabel(preset)}</Text>
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" onPress={props.onAddPreset} style={styles.addPreset}>
        <Text style={styles.addPresetText}>{props.t('coach.clientRoutine.command.addPreset')}</Text>
      </Pressable>
    </View>
  );
}

function RuleRow(props: RowProps): React.JSX.Element {
  const { draft, t, variable } = props;
  const modes = modesFor(variable).map((value) => ({
    label: t(`coach.clientRoutine.command.mode.${value}`),
    value,
  }));
  return (
    <View style={[styles.row, draft.enabled ? styles.rowOn : null]}>
      <Pressable
        accessibilityRole="checkbox"
        aria-checked={draft.enabled}
        disabled={props.locked}
        onPress={() => props.onChange({ enabled: !draft.enabled })}
        style={styles.rowHead}
      >
        <View style={[styles.box, draft.enabled ? styles.boxOn : null]} />
        <Text style={[styles.rowTitle, props.locked ? styles.muted : null]}>
          {t(`coach.clientRoutine.command.var.${variable}`)}
        </Text>
      </Pressable>
      {draft.enabled ? (
        <View style={styles.body}>
          <SegmentedControl
            onChange={(value) => props.onChange({ mode: value as RuleDraft['mode'] })}
            options={modes}
            value={draft.mode}
          />
          <TextInput
            accessibilityLabel={t(`coach.clientRoutine.command.var.${variable}`)}
            keyboardType={KEYBOARD}
            onChangeText={(text) => props.onChange({ text })}
            placeholder={t(`coach.clientRoutine.command.placeholder.${draft.mode}`)}
            style={styles.input}
            value={draft.text}
          />
          <PresetChips {...props} />
        </View>
      ) : null}
    </View>
  );
}

export function ProgressionRulesPanel(props: {
  drafts: Drafts;
  onAddPreset: (variable: CommandVariable) => void;
  onChange: (variable: CommandVariable, patch: Partial<RuleDraft>) => void;
  onRemovePreset: (id: string) => void;
  presets: CoachPresetItem[];
  t: Translate;
}): React.JSX.Element {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{props.t('coach.clientRoutine.command.rules')}</Text>
      <Text style={styles.hint}>{props.t('coach.clientRoutine.command.limit', { count: enabledCount(props.drafts) })}</Text>
      {COMMAND_VARIABLES.map((variable) => (
        <RuleRow
          draft={props.drafts[variable]}
          key={variable}
          locked={!canEnable(props.drafts, variable)}
          onAddPreset={() => props.onAddPreset(variable)}
          onChange={(patch) => props.onChange(variable, patch)}
          onRemovePreset={props.onRemovePreset}
          presets={props.presets.filter((preset) => preset.variable === variable)}
          t={props.t}
          variable={variable}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  addPreset: {
    borderColor: colors.primary,
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  addPresetText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '600' },
  body: { gap: space.sm, paddingLeft: space.lg, paddingTop: space.sm },
  box: { borderColor: colors.borderStrong, borderRadius: 4, borderWidth: 1, height: 16, width: 16 },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  hint: { color: colors.textMuted, fontSize: fontSize.xs },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  muted: { color: colors.textMuted },
  panel: { flex: 1, gap: space.sm, minWidth: 280 },
  preset: { backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 2 },
  presetText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '600' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  row: { borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, padding: space.sm },
  rowHead: { alignItems: 'center', flexDirection: 'row', gap: space.sm },
  rowOn: { backgroundColor: colors.surfaceMuted },
  rowTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
});

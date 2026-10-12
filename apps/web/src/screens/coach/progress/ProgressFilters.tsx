import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, SegmentedControl, space, useBreakpoint } from '@trainerpro/ui';
import type { AnalysisMode, DateRange, VariableDef } from './progress-screen.types';
type Props = {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  weeksPreset: number;
  customRange: DateRange | null;
  onPreset: (weeks: 4 | 8 | 12) => void;
  onCustom: () => void;
  variables: VariableDef[];
  activeVarIds: Set<string>;
  onToggle: (id: string) => void;
  t: (key: string) => string;
  children: React.ReactNode;
};
export function ProgressFilters(props: Props): React.JSX.Element {
  return (
    <Card style={styles.filters}>
      <View style={styles.topBar}>
        <ModeSelector mode={props.mode} onChange={props.onModeChange} t={props.t} />
        <RangeSelector
          weeksPreset={props.weeksPreset}
          customRange={props.customRange}
          onPreset={props.onPreset}
          onCustom={props.onCustom}
          t={props.t}
        />
      </View>
      {props.children}
      <View style={styles.variablesRow}>
        {props.variables.map((variable) => (
          <Button
            key={variable.id}
            label={props.t(variable.labelKey)}
            onPress={() => props.onToggle(variable.id)}
            size="sm"
            variant={props.activeVarIds.has(variable.id) ? 'primary' : 'secondary'}
          />
        ))}
      </View>
    </Card>
  );
}
function ModeSelector({
  mode,
  onChange,
  t,
}: {
  mode: AnalysisMode;
  onChange: (m: AnalysisMode) => void;
  t: (k: string) => string;
}) {
  const modes: { id: AnalysisMode; key: string }[] = [
    { id: 'exercise', key: 'coach.progress.filter.mode.exercise' },
    { id: 'session', key: 'coach.progress.filter.mode.session' },
    { id: 'microcycle', key: 'coach.progress.filter.mode.microcycle' },
  ];
  return (
    <ScrollIfCompact>
      <SegmentedControl
        onChange={(value) => onChange(value as AnalysisMode)}
        options={modes.map((m) => ({ label: t(m.key), value: m.id }))}
        value={mode}
      />
    </ScrollIfCompact>
  );
}

function RangeSelector({
  weeksPreset,
  customRange,
  onPreset,
  onCustom,
  t,
}: {
  weeksPreset: number;
  customRange: DateRange | null;
  onPreset: (w: 4 | 8 | 12) => void;
  onCustom: () => void;
  t: (k: string) => string;
}) {
  const customLabel = customRange ? `${customRange.from} – ${customRange.to}` : t('coach.progress.range.custom');
  const options = [
    ...([4, 8, 12] as const).map((w) => ({ label: t(`coach.progress.range.${w}w`), value: String(w) })),
    { label: customLabel, value: 'custom' },
  ];
  return (
    <ScrollIfCompact>
      <SegmentedControl
        accessibilityLabel={t('coach.progress.range.label')}
        onChange={(value) => {
          if (value === 'custom') onCustom();
          else onPreset(Number(value) as 4 | 8 | 12);
        }}
        options={options}
        value={customRange ? 'custom' : String(weeksPreset)}
      />
    </ScrollIfCompact>
  );
}

function ScrollIfCompact({ children }: { children: React.ReactNode }): React.JSX.Element {
  const compact = useBreakpoint() === 'sm';
  if (!compact) return <>{children}</>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filters: { gap: space.md },
  topBar: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'center' },
  variablesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  scrollRow: { maxWidth: '100%', flexGrow: 0 },
});

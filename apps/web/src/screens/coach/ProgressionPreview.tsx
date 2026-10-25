import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { applyProgression, linearDeloadPreset, type ProgressionRule, type ProgressionSet } from '@trainerpro/shared';
import { Button, colors, fontSize, space } from '@trainerpro/ui';

type Translate = (key: string, options?: Record<string, unknown>) => string;

const SAMPLE: ProgressionSet[] = [{ repsMax: 10, repsMin: 8, setIndex: 0, targetRir: 2, weightKg: 60 }];

export function ProgressionPreview(props: { onApply?: (rule: ProgressionRule) => void; t: Translate }): React.JSX.Element {
  const [weeks, setWeeks] = useState<string[] | null>(null);
  const preview = () => {
    const rule = linearDeloadPreset();
    setWeeks(rule.weeks.map((_, index) => formatWeek(applyProgression(SAMPLE, rule, index))));
    props.onApply?.(rule);
  };
  return (
    <View style={{ gap: space.xs, marginBottom: space.md }}>
      <Button label={props.t('coach.progression.preset')} onPress={preview} variant="secondary" />
      {weeks?.map((line, index) => (
        <Text key={line} style={{ color: colors.text, fontSize: fontSize.sm }}>
          {props.t('coach.progression.weekLine', { index: index + 1, line })}
        </Text>
      ))}
    </View>
  );
}

function formatWeek(sets: ProgressionSet[]): string {
  return sets.map((set) => `${set.weightKg ?? 0} kg`).join(' · ');
}

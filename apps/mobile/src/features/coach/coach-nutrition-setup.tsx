import React, { useState } from 'react';
import { Text, View } from 'react-native';
import {
  buildPlanSetupData,
  type CoachPlanSetupData as PlanSetupData,
  type CoachActivityLevel as ActivityLevel,
} from '@trainerpro/shared';
import { CoachButton, CoachField, CoachSelect, ui } from './CoachUi';
import { useNutritionCopy, type NutritionCopyKey } from './coach-nutrition-copy';
const initial: PlanSetupData = buildPlanSetupData({
  age: 30,
  heightCm: 170,
  weightKg: 70,
  sex: 'female',
  formula: 'mifflin',
  activityLevel: 'moderate',
  carbsPct: 45,
  proteinPct: 30,
  fatPct: 25,
});
export function NutritionSetupEditor({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const c = useNutritionCopy();
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const setup = { ...initial, ...raw } as PlanSetupData;
  const [error, setError] = useState('');
  const set = (key: string, next: unknown) => onChange({ ...raw, ...setup, [key]: next });
  const calculate = () => {
    if (
      ![setup.age, setup.heightCm, setup.weightKg].every((v) => Number.isFinite(v) && v > 0) ||
      ![setup.proteinPct, setup.carbsPct, setup.fatPct].every((v) => Number.isFinite(v) && v >= 0 && v <= 100) ||
      setup.proteinPct + setup.carbsPct + setup.fatPct <= 0 ||
      setup.age < 10 ||
      setup.age > 120 ||
      setup.heightCm < 80 ||
      setup.weightKg < 20 ||
      (setup.bodyFatPercent != null && (setup.bodyFatPercent < 0 || setup.bodyFatPercent >= 100))
    ) {
      setError(c('invalid'));
      return;
    }
    onChange({ ...raw, ...buildPlanSetupData(setup) });
    setError('');
  };
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{c('setup')}</Text>
      <CoachSelect
        label={c('formula')}
        value={setup.formula}
        onChange={(v) => set('formula', v)}
        options={['mifflin', 'harris', 'katch', 'cunningham', 'oms'].map((v) => ({ value: v, label: v.toUpperCase() }))}
      />
      <CoachSelect
        label={c('sex')}
        value={setup.sex}
        onChange={(v) => set('sex', v)}
        options={['female', 'male'].map((v) => ({ value: v, label: c(v as 'female' | 'male') }))}
      />
      <CoachSelect
        label={c('activity')}
        value={setup.activityLevel}
        onChange={(v) => set('activityLevel', v as ActivityLevel)}
        options={['sedentary', 'light', 'moderate', 'active', 'very_active'].map((v) => ({
          value: v,
          label: c(v as NutritionCopyKey),
        }))}
      />
      {(
        [
          ['age', 'age'],
          ['heightCm', 'height'],
          ['weightKg', 'weight'],
          ['bodyFatPercent', 'bodyFat'],
          ['targetCalories', 'calories'],
          ['proteinPct', 'protein'],
          ['carbsPct', 'carbs'],
          ['fatPct', 'fat'],
        ] as const
      ).map(([key, label]) => (
        <CoachField
          key={key}
          label={c(label)}
          value={setup[key] == null ? '' : String(setup[key])}
          onChange={(v) => set(key, v === '' ? undefined : Number(v))}
          numeric
        />
      ))}
      <CoachButton label={c('calculate')} onPress={calculate} />
      <Text style={ui.text}>
        {'TDEE: ' +
          Math.round(setup.tdee ?? 0) +
          ' kcal · ' +
          Math.round(setup.proteinG ?? 0) +
          ' g P · ' +
          Math.round(setup.carbsG ?? 0) +
          ' g C · ' +
          Math.round(setup.fatG ?? 0) +
          ' g F'}
      </Text>
      {error ? <Text style={ui.error}>{error}</Text> : null}
    </View>
  );
}
export function defaultNutritionSetup(): PlanSetupData {
  return { ...initial };
}

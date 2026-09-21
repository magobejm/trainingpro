import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { buildPlanSetupData } from './nutrition-tdee.utils';
import type { ActivityLevel, NutritionPlanType, PlanSetupData, TdeeFormula } from './nutrition.types';
import { styles } from './nutrition.styles';

type Props = {
  onBack: () => void;
  onComplete: (input: { name: string; setupData: PlanSetupData; type: NutritionPlanType }) => void;
  planType: NutritionPlanType;
};

const KEYBOARD_NUMERIC = 'numeric' as const;
const FORMULAS: TdeeFormula[] = ['mifflin', 'harris', 'katch', 'cunningham', 'oms'];
const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

// eslint-disable-next-line max-lines-per-function
export function PlanSetupWizard(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'female' | 'male'>('male');
  const [age, setAge] = useState('30');
  const [weightKg, setWeightKg] = useState('75');
  const [heightCm, setHeightCm] = useState('175');
  const [bodyFatPercent, setBodyFatPercent] = useState('18');
  const [formula, setFormula] = useState<TdeeFormula>('mifflin');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [targetCalories, setTargetCalories] = useState('');
  const [proteinPct, setProteinPct] = useState('30');
  const [carbsPct, setCarbsPct] = useState('40');
  const [fatPct, setFatPct] = useState('30');

  const preview = useMemo(
    () =>
      buildPlanSetupData({
        activityLevel,
        age: Number(age) || 0,
        bodyFatPercent: Number(bodyFatPercent) || undefined,
        carbsPct: Number(carbsPct) || 0,
        fatPct: Number(fatPct) || 0,
        formula,
        heightCm: Number(heightCm) || 0,
        proteinPct: Number(proteinPct) || 0,
        sex,
        targetCalories: targetCalories ? Number(targetCalories) : undefined,
        weightKg: Number(weightKg) || 0,
      }),
    [activityLevel, age, bodyFatPercent, carbsPct, fatPct, formula, heightCm, proteinPct, sex, targetCalories, weightKg],
  );

  const canContinue = name.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={props.onBack} style={styles.backButton}>
        <Text style={styles.backLabel}>{t('common.back')}</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{t('coach.nutrition.wizard.title')}</Text>
      <Text style={styles.headerSubtitle}>{t('coach.nutrition.wizard.generic')}</Text>
      <Text style={styles.fieldLabel}>{t('coach.nutrition.plans.name')}</Text>
      <TextInput onChangeText={setName} style={styles.field} value={name} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip active={sex === 'male'} label={t('coach.nutrition.wizard.male')} onPress={() => setSex('male')} />
        <Chip active={sex === 'female'} label={t('coach.nutrition.wizard.female')} onPress={() => setSex('female')} />
      </View>
      <Field label={t('coach.nutrition.wizard.age')} onChange={setAge} value={age} />
      <Field label={t('coach.nutrition.wizard.weight')} onChange={setWeightKg} value={weightKg} />
      <Field label={t('coach.nutrition.wizard.height')} onChange={setHeightCm} value={heightCm} />
      <Field label={t('coach.nutrition.wizard.bodyFat')} onChange={setBodyFatPercent} value={bodyFatPercent} />
      <Text style={styles.fieldLabel}>{t('coach.nutrition.wizard.formula')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {FORMULAS.map((item) => (
          <Chip
            key={item}
            active={formula === item}
            label={t(`coach.nutrition.formulas.${item}`)}
            onPress={() => setFormula(item)}
          />
        ))}
      </View>
      <Text style={styles.fieldLabel}>{t('coach.nutrition.wizard.activity')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {ACTIVITY_LEVELS.map((item) => (
          <Chip
            key={item}
            active={activityLevel === item}
            label={t(`coach.nutrition.activity.${item}`)}
            onPress={() => setActivityLevel(item)}
          />
        ))}
      </View>
      <Field
        label={t('coach.nutrition.wizard.targetCalories')}
        onChange={setTargetCalories}
        placeholder={String(preview.tdee)}
        value={targetCalories}
      />
      <Field label={t('coach.nutrition.wizard.proteinPct')} onChange={setProteinPct} value={proteinPct} />
      <Field label={t('coach.nutrition.wizard.carbsPct')} onChange={setCarbsPct} value={carbsPct} />
      <Field label={t('coach.nutrition.wizard.fatPct')} onChange={setFatPct} value={fatPct} />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('coach.nutrition.wizard.preview')}</Text>
        <Text style={styles.cardMuted}>
          {t('coach.nutrition.wizard.previewSummary', {
            carbs: preview.carbsG,
            fat: preview.fatG,
            protein: preview.proteinG,
            target: preview.targetCalories,
            tdee: preview.tdee,
          })}
        </Text>
      </View>
      <Pressable
        disabled={!canContinue}
        onPress={() => props.onComplete({ name: name.trim(), setupData: preview, type: props.planType })}
        style={[styles.ctaButton, !canContinue && { opacity: 0.5 }]}
      >
        <Text style={styles.ctaLabel}>{t('coach.nutrition.wizard.continue')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Chip(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.chip, props.active && styles.chipActive]}>
      <Text style={[styles.chipLabel, props.active && styles.chipLabelActive]}>{props.label}</Text>
    </Pressable>
  );
}

function Field(props: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}): React.JSX.Element {
  return (
    <View>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        keyboardType={KEYBOARD_NUMERIC}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        style={styles.field}
        value={props.value}
      />
    </View>
  );
}

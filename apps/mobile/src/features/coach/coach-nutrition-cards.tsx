import { MacroTargetBars } from '@trainerpro/ui';
import {
  compareToTarget,
  readPlanSetup,
  type CoachNutritionMeal as NutritionMeal,
  type CoachNutritionPlan as NutritionPlan,
} from '@trainerpro/shared';
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CoachButton, ui } from './CoachUi';
import { useNutritionCopy } from './coach-nutrition-copy';

export function NutritionPlanFacts({ plan }: { plan: NutritionPlan }): React.JSX.Element {
  const { t } = useTranslation();
  const c = useNutritionCopy();
  const setup = readPlanSetup(plan.setupData);
  const totals = {
    caloriesKcal: setup?.targetCalories ?? 0,
    carbsG: setup?.carbsG ?? 0,
    fatG: setup?.fatG ?? 0,
    proteinG: setup?.proteinG ?? 0,
  };
  return (
    <View>
      <Text style={ui.muted}>{plan.type === 'LIBRE' ? c('free') : c('structured')}</Text>
      {setup?.targetCalories ? (
        <Text style={ui.text}>{t('coach.nutrition.mealKcal', { value: setup.targetCalories })}</Text>
      ) : null}
      {setup ? <MacroTargetBars comparison={compareToTarget(totals, setup)} t={t} /> : null}
    </View>
  );
}

export function NutritionMealFacts({ meal }: { meal: NutritionMeal }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={ui.text}>{t('coach.nutrition.mealKcal', { value: Math.round(meal.totals?.caloriesKcal ?? 0) })}</Text>
      <Text style={ui.muted}>{t('coach.nutrition.foodsCount', { count: meal.ingredients.length })}</Text>
    </View>
  );
}

export function NutritionCardMenu(props: {
  open: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onToggle: () => void;
  pending: boolean;
}): React.JSX.Element {
  const c = useNutritionCopy();
  if (!props.open) return <CoachButton label={c('actions')} onPress={props.onToggle} />;
  return (
    <View>
      <CoachButton label={c('edit')} onPress={props.onEdit} />
      <CoachButton label={c('duplicate')} onPress={props.onDuplicate} />
      <CoachButton danger disabled={props.pending} label={c('delete')} onPress={props.onDelete} />
    </View>
  );
}

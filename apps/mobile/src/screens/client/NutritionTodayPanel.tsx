import { DayMealsList, MacroTargetBars } from '@trainerpro/ui';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  buildDayMacros,
  compareToTarget,
  readPlanSetup,
  resolvePlanDay,
  shiftPlanDate,
  type FoodMacroSource,
  type MealMacroSource,
} from '@trainerpro/shared';
import type { ClientNutrition, NutritionPlan } from '../../data/hooks/useClientNutrition';
import { styles } from './nutrition-plan.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function NutritionTodayPanel({
  data,
  date,
  onShift,
  plan,
  t,
}: {
  data: ClientNutrition;
  date: Date;
  onShift: (days: number) => void;
  plan: NutritionPlan;
  t: Translate;
}): React.JSX.Element {
  const day = resolvePlanDay(plan, plan.assignedAt, date);
  const macros = buildDayMacros(day, (data.meals ?? []) as MealMacroSource[], (data.foods ?? []) as FoodMacroSource[]);
  return (
    <>
      <View style={styles.dayRow}>
        <Pressable
          accessibilityLabel={t('client.nutrition.previousDay')}
          onPress={() => onShift(-1)}
          style={styles.dayButton}
        >
          <Text style={styles.dayLabel}>{t('client.nutrition.previousDay')}</Text>
        </Pressable>
        <Text style={styles.dayLabel}>{formatDay(date)}</Text>
        <Pressable accessibilityLabel={t('client.nutrition.nextDay')} onPress={() => onShift(1)} style={styles.dayButton}>
          <Text style={styles.dayLabel}>{t('client.nutrition.nextDay')}</Text>
        </Pressable>
      </View>
      <MacroTargetBars comparison={compareToTarget(macros.total, readPlanSetup(plan.setupData))} t={t} />
      {day.empty ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{t('client.nutrition.noMealsToday')}</Text>
        </View>
      ) : (
        <DayMealsList meals={macros.meals} t={t} />
      )}
    </>
  );
}

export function moveNutritionDay(date: Date, days: number): Date {
  return shiftPlanDate(date, days);
}

function formatDay(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

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
import { useNutritionLogs } from '../../data/hooks/useNutritionLogs';
import { NutritionMealActions } from './NutritionMealActions';
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
  const dateKey = formatKey(date);
  const logs = useNutritionLogs(dateKey);
  const macros = buildDayMacros(day, (data.meals ?? []) as MealMacroSource[], (data.foods ?? []) as FoodMacroSource[]);
  const eatenMeals = day.meals.filter((meal) => logs.data?.some((log) => log.mealKey === meal.key && log.status === 'DONE'));
  const eaten = buildDayMacros(
    { ...day, meals: eatenMeals },
    (data.meals ?? []) as MealMacroSource[],
    (data.foods ?? []) as FoodMacroSource[],
  );
  const planned = macros.total;
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
      <Text style={styles.dayLabel}>{t('client.nutrition.plannedTitle')}</Text>
      <MacroTargetBars comparison={compareToTarget(macros.total, readPlanSetup(plan.setupData))} t={t} />
      <Text style={styles.dayLabel}>{t('client.nutrition.eatenTitle')}</Text>
      <MacroTargetBars
        comparison={compareToTarget(eaten.total, {
          carbsG: planned.carbsG,
          fatG: planned.fatG,
          proteinG: planned.proteinG,
          targetCalories: planned.caloriesKcal,
        })}
        t={t}
      />
      {day.empty ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{t('client.nutrition.noMealsToday')}</Text>
        </View>
      ) : (
        <DayMealsList
          meals={macros.meals}
          renderExtra={(meal) => (
            <NutritionMealActions
              date={dateKey}
              mealKey={meal.key}
              mealName={meal.name}
              planId={plan.id}
              saved={logs.data?.find((log) => log.mealKey === meal.key && log.planId === plan.id)}
              t={t}
            />
          )}
          t={t}
        />
      )}
    </>
  );
}

export function moveNutritionDay(date: Date, days: number): Date {
  return shiftPlanDate(date, days);
}

function formatKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDay(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

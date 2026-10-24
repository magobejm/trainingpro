import { DayMealsList, MacroTargetBars } from '@trainerpro/ui';
import React, { useState } from 'react';
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
import { NutritionSubstituteSheet } from './NutritionSubstituteSheet';
import { styles } from './nutrition-plan.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function NutritionTodayPanel({
  data,
  date,
  onReset,
  onShift,
  plan,
  t,
}: {
  data: ClientNutrition;
  date: Date;
  onReset: () => void;
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
  const [selected, setSelected] = useState<{ foodId: string; grams: number; name: string } | null>(null);
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
        <Text style={styles.dayLabel}>{formatDayHeading(date, t)}</Text>
        <Pressable accessibilityLabel={t('client.nutrition.nextDay')} onPress={() => onShift(1)} style={styles.dayButton}>
          <Text style={styles.dayLabel}>{t('client.nutrition.nextDay')}</Text>
        </Pressable>
      </View>
      {sameDay(date, new Date()) ? null : (
        <Pressable onPress={onReset}>
          <Text style={styles.backToday}>{t('client.nutrition.backToToday')}</Text>
        </Pressable>
      )}
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
        <>
          <DayMealsList
            meals={macros.meals}
            onPressItem={(item) => {
              if (item.foodId) setSelected({ foodId: item.foodId, grams: item.amountGrams ?? 100, name: item.name });
            }}
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
          {selected ? (
            <NutritionSubstituteSheet
              foodId={selected.foodId}
              grams={selected.grams}
              name={selected.name}
              onClose={() => setSelected(null)}
              t={t}
            />
          ) : null}
        </>
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

function formatDayHeading(date: Date, t: Translate): string {
  const diff = dayDiff(date, new Date());
  if (diff === 0) return t('client.nutrition.dayToday');
  if (diff === 1) return t('client.nutrition.dayTomorrow');
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'long' });
}

function sameDay(left: Date, right: Date): boolean {
  return dayDiff(left, right) === 0;
}

function dayDiff(date: Date, today: Date): number {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((start - base) / 86_400_000);
}

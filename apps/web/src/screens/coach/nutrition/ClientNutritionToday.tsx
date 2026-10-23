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
import type { NutritionPlan } from './nutrition.types';
import { styles } from './nutrition.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function ClientNutritionToday({
  foods,
  meals,
  plan,
  t,
}: {
  foods: FoodMacroSource[];
  meals: MealMacroSource[];
  plan: NutritionPlan;
  t: Translate;
}): React.JSX.Element {
  const [day, setDay] = useState(() => new Date());
  const resolved = resolvePlanDay(plan, plan.assignedAt, day);
  const macros = buildDayMacros(resolved, meals, foods);
  return (
    <View>
      <Text style={styles.sectionTitle}>{t('coach.nutrition.client.todayTitle')}</Text>
      <View style={styles.todayRow}>
        <Pressable
          accessibilityLabel={t('client.nutrition.previousDay')}
          onPress={() => setDay((current) => shiftPlanDate(current, -1))}
        >
          <Text style={styles.todayStep}>{t('client.nutrition.previousDay')}</Text>
        </Pressable>
        <Text style={styles.todayDate}>{formatDay(day)}</Text>
        <Pressable
          accessibilityLabel={t('client.nutrition.nextDay')}
          onPress={() => setDay((current) => shiftPlanDate(current, 1))}
        >
          <Text style={styles.todayStep}>{t('client.nutrition.nextDay')}</Text>
        </Pressable>
      </View>
      <MacroTargetBars comparison={compareToTarget(macros.total, readPlanSetup(plan.setupData))} t={t} />
      {resolved.empty ? (
        <Text style={styles.headerSubtitle}>{t('client.nutrition.noMealsToday')}</Text>
      ) : (
        <DayMealsList meals={macros.meals} t={t} />
      )}
    </View>
  );
}

function formatDay(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

import {
  buildDayMacros,
  compareToTarget,
  formatFoodAmount,
  readPlanSetup,
  resolvePlanDay,
  shiftPlanDate,
  type FoodMacroSource,
  type MealMacroSource,
} from '@trainerpro/shared';
import { DayMealsList, MacroTargetBars } from '@trainerpro/ui';
import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useNutritionAdherenceQuery, type NutritionAdherenceMeal } from '../../../data/hooks/useNutrition';
import type { NutritionPlan } from './nutrition.types';
import { styles } from './nutrition.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function ClientNutritionToday({
  clientId,
  foods,
  meals,
  plan,
  t,
}: {
  clientId: string;
  foods: FoodMacroSource[];
  meals: MealMacroSource[];
  plan: NutritionPlan;
  t: Translate;
}): React.JSX.Element {
  const [day, setDay] = useState(() => new Date());
  const date = dateKey(day);
  const logs = useNutritionAdherenceQuery(clientId, date, date);
  const resolved = resolvePlanDay(plan, plan.assignedAt, day);
  const macros = buildDayMacros(resolved, meals, foods);
  const logged = logs.data?.days[0]?.meals ?? [];
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
        <DayMealsList
          meals={macros.meals}
          renderExtra={(meal) => <TodayMealLog log={logged.find((item) => item.mealKey === meal.key)} t={t} />}
          t={t}
        />
      )}
    </View>
  );
}

function TodayMealLog(props: { log?: NutritionAdherenceMeal; t: Translate }): React.JSX.Element | null {
  if (!props.log) return null;
  const status = props.log.status === 'CHANGED' ? 'Changed' : props.log.status === 'SKIPPED' ? 'Skipped' : 'Done';
  return (
    <View>
      <Text style={styles.headerSubtitle}>{props.t(`coach.nutrition.client.status${status}`)}</Text>
      {props.log.comment ? <Text style={styles.headerSubtitle}>{props.log.comment}</Text> : null}
      {props.log.eatenItems.map((item) => (
        <Text key={item.foodId} style={styles.headerSubtitle}>
          {props.t('coach.nutrition.client.eatenItem', {
            amount: formatFoodAmount(item.amount, item.servingUnit, (key, options) => props.t(key, options)),
            name: item.name,
          })}
        </Text>
      ))}
      {props.log.aiEstimate ? (
        <Text style={styles.headerSubtitle}>{props.t('coach.nutrition.client.estimateApprox', props.log.aiEstimate)}</Text>
      ) : null}
      {props.log.photoUrl ? <Image source={{ uri: props.log.photoUrl }} style={styles.logPhoto} /> : null}
    </View>
  );
}

function dateKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDay(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

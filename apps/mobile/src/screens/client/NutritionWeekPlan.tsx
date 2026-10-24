import { ClientNutritionMacrosCard, ConsiderationBadges, DayMealsList } from '@trainerpro/ui';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  buildDayMacros,
  resolvePlanDay,
  shiftPlanDate,
  type DayMealMacros,
  type FoodMacroSource,
  type MealMacroSource,
} from '@trainerpro/shared';
import type { ClientNutrition, NutritionPlan } from '../../data/hooks/useClientNutrition';
import { readSetupData } from './nutrition-plan.helpers';
import { styles } from './nutrition-plan.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;
type MealSource = NonNullable<ClientNutrition['meals']>[number];

export function NutritionWeekPlan(props: {
  foods?: ClientNutrition['foods'];
  locale: string;
  meals?: ClientNutrition['meals'];
  plan: NutritionPlan;
  t: Translate;
}): React.JSX.Element {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const setup = readSetupData(props.plan.setupData);
  const days = weekDays(props.plan, props.meals ?? [], props.foods ?? [], props.locale);
  return (
    <>
      {props.plan.description ? <Text style={styles.planDescription}>{props.plan.description}</Text> : null}
      {setup ? <ClientNutritionMacrosCard setup={setup} t={props.t} /> : null}
      {days.map((day) => (
        <WeekDay
          day={day}
          foods={props.foods}
          key={day.key}
          meals={props.meals ?? []}
          onToggle={(key) => setOpenKey((current) => (current === key ? null : key))}
          openKey={openKey}
          t={props.t}
        />
      ))}
    </>
  );
}

function WeekDay(props: {
  day: WeekDayView;
  foods?: ClientNutrition['foods'];
  meals: MealSource[];
  onToggle: (key: string) => void;
  openKey: string | null;
  t: Translate;
}): React.JSX.Element {
  return (
    <View style={styles.mealCard}>
      <Text style={styles.planName}>{props.day.label}</Text>
      {props.day.meals.length === 0 ? <Text style={styles.empty}>{props.t('client.nutrition.noMealsToday')}</Text> : null}
      {props.day.meals.map((meal) => (
        <WeekMeal
          foods={props.foods}
          key={meal.key}
          meal={meal}
          meals={props.meals}
          onToggle={props.onToggle}
          open={props.openKey === `${props.day.key}:${meal.key}`}
          rowKey={`${props.day.key}:${meal.key}`}
          t={props.t}
        />
      ))}
    </View>
  );
}

function WeekMeal(props: {
  foods?: ClientNutrition['foods'];
  meal: DayMealMacros;
  meals: MealSource[];
  onToggle: (key: string) => void;
  open: boolean;
  rowKey: string;
  t: Translate;
}): React.JSX.Element {
  return (
    <View>
      <Pressable onPress={() => props.onToggle(props.rowKey)}>
        <Text style={styles.item}>{mealHeading(props.meal, props.t)}</Text>
      </Pressable>
      {props.open ? <DayMealsList meals={[props.meal]} showTitle={false} t={props.t} /> : null}
      {props.open ? <ConsiderationBadges items={mealNotes(props.meal, props.meals, props.foods)} t={props.t} /> : null}
    </View>
  );
}

type WeekDayView = { key: string; label: string; meals: DayMealMacros[] };

function weekDays(plan: NutritionPlan, meals: MealMacroSource[], foods: FoodMacroSource[], locale: string): WeekDayView[] {
  const start = mondayOf(new Date());
  return [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const date = shiftPlanDate(start, offset);
    const resolved = resolvePlanDay(plan, plan.assignedAt, date);
    return {
      key: String(offset),
      label: resolved.dayLabel ?? date.toLocaleDateString(locale, { day: 'numeric', month: 'short', weekday: 'long' }),
      meals: buildDayMacros(resolved, meals, foods).meals,
    };
  });
}

function mealHeading(meal: DayMealMacros, t: Translate): string {
  const category = meal.category ? t(`client.nutrition.category.${meal.category}`) : meal.name;
  const name = meal.category && category === `client.nutrition.category.${meal.category}` ? meal.name : category;
  return meal.time ? `${name} · ${meal.time}` : name;
}

function mealNotes(meal: DayMealMacros, meals: MealSource[], foods?: ClientNutrition['foods']) {
  const fromMeal = meals.find((candidate) => candidate.name === meal.name)?.considerations ?? [];
  if (fromMeal.length > 0) return fromMeal;
  return meal.items.flatMap((item) => foods?.find((food) => food.id === item.foodId)?.considerations ?? []);
}

function mondayOf(date: Date): Date {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = day.getDay();
  day.setDate(day.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return day;
}

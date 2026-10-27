import { EmptyIllustration } from '../../../components/EmptyIllustrations';
import React from 'react';
import { Text, View } from 'react-native';
import { formatFoodAmount } from '@trainerpro/shared';
import { EmptyState } from '@trainerpro/ui';
import type { FreePlanContent, NutritionMeal, NutritionPlanType, StructuredPlanContent } from './nutrition.types';
import { styles } from './nutrition.styles';
import { planContentStyles } from './client-plan.styles';

type Translate = (key: string, params?: Record<string, number | string>) => string;
type FoodRef = { id: string; servingUnit?: string | null };

const FREE_COLUMN_ORDER = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];

type Props = {
  content: unknown;
  foods: FoodRef[];
  meals: NutritionMeal[];
  t: Translate;
  type: NutritionPlanType;
};

/** Contenido legible de un plan, con los alimentos de cada comida. */
export function PlanContentView(props: Props): React.JSX.Element {
  if (props.type === 'LIBRE') return <FreePlanContentView {...props} />;
  return <StructuredPlanContentView {...props} />;
}

function FreePlanContentView(props: Props): React.JSX.Element {
  const content = (props.content as FreePlanContent | undefined) ?? { columns: {} };
  const columns = orderedFreeColumns(content.columns ?? {});
  if (columns.length === 0) {
    return <EmptyState icon={<EmptyIllustration kind={'library'} />} title={props.t('coach.nutrition.client.noContent')} />;
  }
  return (
    <>
      {columns.map(([column, items]) => (
        <View key={column} style={styles.card}>
          <Text style={styles.cardTitle}>{props.t(`coach.nutrition.categories.${column}`, { defaultValue: column })}</Text>
          {items.map((item) => (
            <View key={item.id} style={planContentStyles.meal}>
              <Text style={planContentStyles.mealName}>{freeItemLabel(item, props.foods, props.t)}</Text>
              {mealIngredientLines(item.mealId, props.meals, props.t).map((line) => (
                <Text key={line} style={planContentStyles.ingredient}>
                  {line}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

function StructuredPlanContentView(props: Props): React.JSX.Element {
  const content = (props.content as StructuredPlanContent | undefined) ?? { weeks: [] };
  if (content.weeks.length === 0) {
    return <EmptyState icon={<EmptyIllustration kind={'library'} />} title={props.t('coach.nutrition.client.noContent')} />;
  }
  return (
    <>
      {content.weeks.map((week) => (
        <View key={week.id} style={styles.card}>
          <Text style={styles.cardTitle}>{week.label}</Text>
          {week.days.map((day) => (
            <View key={day.id} style={planContentStyles.day}>
              <Text style={planContentStyles.dayLabel}>{day.label}</Text>
              {(day.meals ?? []).map((meal) => (
                <View key={meal.id} style={planContentStyles.meal}>
                  <Text style={planContentStyles.mealName}>{meal.name}</Text>
                  {mealIngredientLines(meal.mealId, props.meals, props.t).map((line) => (
                    <Text key={line} style={planContentStyles.ingredient}>
                      {line}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

function orderedFreeColumns(columns: FreePlanContent['columns']): Array<[string, FreePlanContent['columns'][string]]> {
  const known = FREE_COLUMN_ORDER.filter((key) => (columns[key]?.length ?? 0) > 0).map(
    (key) => [key, columns[key] ?? []] as [string, FreePlanContent['columns'][string]],
  );
  const extra = Object.entries(columns).filter(([key, items]) => !FREE_COLUMN_ORDER.includes(key) && items.length > 0);
  return [...known, ...extra];
}

function freeItemLabel(item: FreePlanContent['columns'][string][number], foods: FoodRef[], t: Translate): string {
  const name = item.mealName ?? item.foodName ?? '—';
  const unit = foods.find((food) => food.id === item.foodId)?.servingUnit;
  const amount = formatFoodAmount(item.amountGrams, unit, t);
  return amount ? `${name} · ${amount}` : name;
}

function mealIngredientLines(mealId: string | undefined, meals: NutritionMeal[], t: Translate): string[] {
  if (!mealId) return [];
  const meal = meals.find((item) => item.id === mealId);
  if (!meal) return [];
  return meal.ingredients.map((item) => {
    const amount = formatFoodAmount(item.amountGrams, item.food.servingUnit, t);
    return amount ? `${item.food.name} · ${amount}` : item.food.name;
  });
}

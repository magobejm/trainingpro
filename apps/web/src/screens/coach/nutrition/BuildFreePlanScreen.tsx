import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  useCreatePlanMutation,
  useNutritionMealsQuery,
  useNutritionPlansQuery,
  useUpdatePlanMutation,
} from '../../../data/hooks/useNutrition';
import type { FreePlanContent, FreePlanItem, PlanSetupData } from './nutrition.types';
import { FREE_PLAN_COLUMNS } from './nutrition.types';
import { styles } from './nutrition.styles';

type Props = {
  onBack: () => void;
  onSaved: (planId: string) => void;
  planId?: string;
  planName: string;
  setupData: PlanSetupData;
};

export function BuildFreePlanScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const mealsQuery = useNutritionMealsQuery();
  const plansQuery = useNutritionPlansQuery();
  const createMutation = useCreatePlanMutation();
  const updateMutation = useUpdatePlanMutation();
  const [content, setContent] = useState<FreePlanContent>(emptyContent());

  useEffect(() => {
    if (!props.planId) return;
    const plan = plansQuery.data?.find((item) => item.id === props.planId);
    if (plan?.content) setContent(readContent(plan.content));
  }, [plansQuery.data, props.planId]);

  const meals = mealsQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container} horizontal>
      <View style={{ minWidth: 900 }}>
        <Pressable onPress={props.onBack} style={styles.backButton}>
          <Text style={styles.backLabel}>{t('common.back')}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{props.planName}</Text>
        <Text style={styles.headerSubtitle}>{t('coach.nutrition.buildFree.subtitle')}</Text>
        <ScrollView horizontal contentContainerStyle={styles.horizontalScroll}>
          {FREE_PLAN_COLUMNS.map((column) => (
            <View key={column} style={styles.column}>
              <Text style={styles.columnTitle}>{t(`coach.nutrition.categories.${column}`)}</Text>
              {(content.columns[column] ?? []).map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <Text style={styles.cardTitle}>{item.mealName ?? item.foodName}</Text>
                </View>
              ))}
              {meals
                .filter((meal) => meal.category === column)
                .slice(0, 3)
                .map((meal) => (
                  <Pressable
                    key={meal.id}
                    onPress={() => addMeal(content, setContent, column, meal.id, meal.name)}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryLabel}>{t('coach.nutrition.meals.addButton', { name: meal.name })}</Text>
                  </Pressable>
                ))}
            </View>
          ))}
        </ScrollView>
        <Pressable
          disabled={createMutation.isPending || updateMutation.isPending}
          onPress={() => void savePlan(props, content, createMutation, updateMutation)}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaLabel}>
            {createMutation.isPending || updateMutation.isPending ? t('coach.nutrition.saving') : t('coach.nutrition.save')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function emptyContent(): FreePlanContent {
  return {
    columns: FREE_PLAN_COLUMNS.reduce<Record<string, FreePlanItem[]>>((acc, column) => {
      acc[column] = [];
      return acc;
    }, {}),
  };
}

function readContent(value: unknown): FreePlanContent {
  if (!value || typeof value !== 'object') return emptyContent();
  const raw = value as Partial<FreePlanContent>;
  const base = emptyContent();
  for (const column of FREE_PLAN_COLUMNS) {
    if (Array.isArray(raw.columns?.[column])) {
      base.columns[column] = raw.columns[column] as FreePlanItem[];
    }
  }
  return base;
}

function addMeal(
  content: FreePlanContent,
  setContent: React.Dispatch<React.SetStateAction<FreePlanContent>>,
  column: string,
  mealId: string,
  mealName: string,
): void {
  const item: FreePlanItem = {
    id: `${mealId}-${Date.now()}`,
    mealId,
    mealName,
    type: 'meal',
  };
  setContent({
    columns: {
      ...content.columns,
      [column]: [...(content.columns[column] ?? []), item],
    },
  });
}

async function savePlan(
  props: Props,
  content: FreePlanContent,
  createMutation: ReturnType<typeof useCreatePlanMutation>,
  updateMutation: ReturnType<typeof useUpdatePlanMutation>,
): Promise<void> {
  if (props.planId) {
    await updateMutation.mutateAsync({
      planId: props.planId,
      payload: { content, name: props.planName, setupData: props.setupData },
    });
    props.onSaved(props.planId);
    return;
  }
  const result = await createMutation.mutateAsync({
    content,
    name: props.planName,
    setupData: props.setupData,
    type: 'LIBRE',
  });
  props.onSaved(result.id);
}

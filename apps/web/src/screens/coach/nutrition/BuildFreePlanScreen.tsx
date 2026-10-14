import { NutritionPlanActions } from '../../../features/client-preview/NutritionPlanActions';
import { getLayoutStyle1 } from './BuildFreePlanScreen.layout-styles';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import {
  useCreatePlanMutation,
  useNutritionMealsQuery,
  useNutritionPlansQuery,
  useUpdatePlanMutation,
} from '../../../data/hooks/useNutrition';
import type { FreePlanContent, FreePlanItem, PlanSetupData } from './nutrition.types';
import { FREE_PLAN_COLUMNS } from './nutrition.types';
import { styles } from './nutrition.styles';
import { Button, useToast } from '@trainerpro/ui';
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
  const toast = useToast();
  const saving = createMutation.isPending || updateMutation.isPending;
  useEffect(() => {
    if (!props.planId) return;
    const plan = plansQuery.data?.find((item) => item.id === props.planId);
    if (plan?.content) setContent(readContent(plan.content));
  }, [plansQuery.data, props.planId]);
  const meals = mealsQuery.data ?? [];
  const savedPlan = plansQuery.data?.find((item) => item.id === props.planId);
  const isDraft =
    !props.planId ||
    Boolean(
      savedPlan &&
      (JSON.stringify(content) !== JSON.stringify(readContent(savedPlan.content)) ||
        props.planName !== savedPlan.name ||
        JSON.stringify(props.setupData) !== JSON.stringify(savedPlan.setupData)),
    );
  const previewPlan = {
    name: props.planName,
    type: 'LIBRE' as const,
    content,
    setupData: props.setupData,
    description: savedPlan?.description,
  };
  const previewDisabled = Boolean(props.planId && (plansQuery.isLoading || plansQuery.isError || !savedPlan));
  const layoutStyle1 = getLayoutStyle1;
  return (
    <ScrollView contentContainerStyle={styles.container} horizontal>
      <View style={layoutStyle1}>
        <Button label={t('common.back')} onPress={props.onBack} size="sm" style={styles.backButton} variant="secondary" />
        <Text style={styles.headerTitle}>{props.planName}</Text>
        <Text style={styles.headerSubtitle}>{t('coach.nutrition.buildFree.subtitle')}</Text>
        <NutritionPlanActions
          plan={previewPlan}
          meals={meals}
          isDraft={isDraft}
          disabled={previewDisabled || mealsQuery.isLoading || mealsQuery.isError}
        />
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
                  <Button
                    key={meal.id}
                    label={t('coach.nutrition.meals.addButton', { name: meal.name })}
                    onPress={() => addMeal(content, setContent, column, meal.id, meal.name)}
                    size="sm"
                    style={styles.addButton}
                    variant="secondary"
                  />
                ))}
            </View>
          ))}
        </ScrollView>
        <Button
          label={saving ? t('coach.nutrition.saving') : t('coach.nutrition.save')}
          loading={saving}
          onPress={() =>
            void savePlan(props, content, createMutation, updateMutation).then(() =>
              toast.success(t('coach.nutrition.plans.savedToast')),
            )
          }
          style={styles.ctaButton}
        />
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

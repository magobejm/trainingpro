import { getLayoutStyle1 } from './BuildStructuredPlanScreen.layout-styles';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import {
  useCreatePlanMutation,
  useNutritionMealsQuery,
  useNutritionPlansQuery,
  useUpdatePlanMutation,
} from '../../../data/hooks/useNutrition';
import type { PlanSetupData, StructuredDay, StructuredPlanContent, StructuredWeek } from './nutrition.types';
import { styles } from './nutrition.styles';
import { Button, TextField, useToast } from '@trainerpro/ui';
type Props = {
  onBack: () => void;
  onSaved: (planId: string) => void;
  planId?: string;
  planName: string;
  setupData: PlanSetupData;
};
export function BuildStructuredPlanScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const mealsQuery = useNutritionMealsQuery();
  const plansQuery = useNutritionPlansQuery();
  const createMutation = useCreatePlanMutation();
  const updateMutation = useUpdatePlanMutation();
  const [content, setContent] = useState<StructuredPlanContent>(defaultContent());
  const toast = useToast();
  const saving = createMutation.isPending || updateMutation.isPending;
  useEffect(() => {
    if (!props.planId) return;
    const plan = plansQuery.data?.find((item) => item.id === props.planId);
    if (plan?.content) setContent(readContent(plan.content));
  }, [plansQuery.data, props.planId]);
  const meals = mealsQuery.data ?? [];
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button label={t('common.back')} onPress={props.onBack} size="sm" style={styles.backButton} variant="secondary" />
      <Text style={styles.headerTitle}>{props.planName}</Text>
      <Text style={styles.headerSubtitle}>{t('coach.nutrition.buildStructured.subtitle')}</Text>
      {content.weeks.map((week, weekIndex) => (
        <View key={week.id} style={styles.card}>
          <Text style={styles.cardTitle}>{week.label}</Text>
          {week.days.map((day, dayIndex) => {
            const layoutStyle1 = getLayoutStyle1;
            return (
              <View key={day.id} style={layoutStyle1}>
                <TextField
                  containerStyle={styles.fieldGap}
                  onChangeText={(value) => renameDay(content, setContent, weekIndex, dayIndex, value)}
                  value={day.label}
                />
                {day.meals.map((meal, mealIndex) => (
                  <View key={meal.id} style={styles.listItem}>
                    <Text style={styles.cardTitle}>{meal.name}</Text>
                    <Button
                      label={t('coach.nutrition.delete')}
                      onPress={() => removeMeal(content, setContent, weekIndex, dayIndex, mealIndex)}
                      size="sm"
                      style={styles.addButton}
                      variant="danger"
                    />
                  </View>
                ))}
                {meals.slice(0, 2).map((meal) => (
                  <Button
                    key={`${day.id}-${meal.id}`}
                    label={t('coach.nutrition.meals.addButton', { name: meal.name })}
                    onPress={() => addMeal(content, setContent, weekIndex, dayIndex, meal.id, meal.name)}
                    size="sm"
                    style={styles.addButton}
                    variant="secondary"
                  />
                ))}
              </View>
            );
          })}
        </View>
      ))}
      <Button
        label={t('coach.nutrition.buildStructured.addWeek')}
        onPress={() => addWeek(content, setContent, t)}
        style={styles.addButton}
        variant="secondary"
      />
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
    </ScrollView>
  );
}
function defaultContent(): StructuredPlanContent {
  return {
    weeks: [
      {
        days: buildDays(7, 'Day'),
        id: 'week-1',
        label: 'Week 1',
      },
    ],
  };
}
function buildDays(count: number, prefix: string): StructuredDay[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `day-${index + 1}`,
    label: `${prefix} ${index + 1}`,
    meals: [],
  }));
}
function readContent(value: unknown): StructuredPlanContent {
  if (!value || typeof value !== 'object') return defaultContent();
  const raw = value as Partial<StructuredPlanContent>;
  if (!Array.isArray(raw.weeks) || raw.weeks.length === 0) return defaultContent();
  return { weeks: raw.weeks as StructuredWeek[] };
}
function addWeek(
  content: StructuredPlanContent,
  setContent: React.Dispatch<React.SetStateAction<StructuredPlanContent>>,
  t: (key: string, params?: Record<string, number | string>) => string,
): void {
  const index = content.weeks.length + 1;
  setContent({
    weeks: [
      ...content.weeks,
      {
        days: buildDays(7, t('coach.nutrition.buildStructured.day')),
        id: `week-${index}`,
        label: t('coach.nutrition.buildStructured.week', { index }),
      },
    ],
  });
}
function renameDay(
  content: StructuredPlanContent,
  setContent: React.Dispatch<React.SetStateAction<StructuredPlanContent>>,
  weekIndex: number,
  dayIndex: number,
  label: string,
): void {
  const week = content.weeks[weekIndex];
  const day = week?.days[dayIndex];
  if (!week || !day) return;
  const weeks = [...content.weeks];
  const days = [...week.days];
  days[dayIndex] = { ...day, label };
  weeks[weekIndex] = { ...week, days };
  setContent({ weeks });
}
function addMeal(
  content: StructuredPlanContent,
  setContent: React.Dispatch<React.SetStateAction<StructuredPlanContent>>,
  weekIndex: number,
  dayIndex: number,
  mealId: string,
  mealName: string,
): void {
  const week = content.weeks[weekIndex];
  const day = week?.days[dayIndex];
  if (!week || !day) return;
  const weeks = [...content.weeks];
  const days = [...week.days];
  const meals = [...day.meals, { id: `${mealId}-${Date.now()}`, mealId, name: mealName }];
  days[dayIndex] = { ...day, meals };
  weeks[weekIndex] = { ...week, days };
  setContent({ weeks });
}
function removeMeal(
  content: StructuredPlanContent,
  setContent: React.Dispatch<React.SetStateAction<StructuredPlanContent>>,
  weekIndex: number,
  dayIndex: number,
  mealIndex: number,
): void {
  const week = content.weeks[weekIndex];
  const day = week?.days[dayIndex];
  if (!week || !day) return;
  const weeks = [...content.weeks];
  const days = [...week.days];
  const meals = day.meals.filter((_, index) => index !== mealIndex);
  days[dayIndex] = { ...day, meals };
  weeks[weekIndex] = { ...week, days };
  setContent({ weeks });
}
async function savePlan(
  props: Props,
  content: StructuredPlanContent,
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
    type: 'ESTRUCTURADO',
  });
  props.onSaved(result.id);
}

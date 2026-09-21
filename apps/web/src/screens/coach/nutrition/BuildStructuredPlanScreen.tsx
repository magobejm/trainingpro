import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  useCreatePlanMutation,
  useNutritionMealsQuery,
  useNutritionPlansQuery,
  useUpdatePlanMutation,
} from '../../../data/hooks/useNutrition';
import type { PlanSetupData, StructuredDay, StructuredPlanContent, StructuredWeek } from './nutrition.types';
import { styles } from './nutrition.styles';

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

  useEffect(() => {
    if (!props.planId) return;
    const plan = plansQuery.data?.find((item) => item.id === props.planId);
    if (plan?.content) setContent(readContent(plan.content));
  }, [plansQuery.data, props.planId]);

  const meals = mealsQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={props.onBack} style={styles.backButton}>
        <Text style={styles.backLabel}>{t('common.back')}</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{props.planName}</Text>
      <Text style={styles.headerSubtitle}>{t('coach.nutrition.buildStructured.subtitle')}</Text>
      {content.weeks.map((week, weekIndex) => (
        <View key={week.id} style={styles.card}>
          <Text style={styles.cardTitle}>{week.label}</Text>
          {week.days.map((day, dayIndex) => (
            <View key={day.id} style={{ marginTop: 10 }}>
              <TextInput
                onChangeText={(value) => renameDay(content, setContent, weekIndex, dayIndex, value)}
                style={styles.field}
                value={day.label}
              />
              {day.meals.map((meal, mealIndex) => (
                <View key={meal.id} style={styles.listItem}>
                  <Text style={styles.cardTitle}>{meal.name}</Text>
                  <Pressable
                    onPress={() => removeMeal(content, setContent, weekIndex, dayIndex, mealIndex)}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryLabel}>{t('coach.nutrition.delete')}</Text>
                  </Pressable>
                </View>
              ))}
              {meals.slice(0, 2).map((meal) => (
                <Pressable
                  key={`${day.id}-${meal.id}`}
                  onPress={() => addMeal(content, setContent, weekIndex, dayIndex, meal.id, meal.name)}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryLabel}>{t('coach.nutrition.meals.addButton', { name: meal.name })}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      ))}
      <Pressable onPress={() => addWeek(content, setContent, t)} style={styles.secondaryButton}>
        <Text style={styles.secondaryLabel}>{t('coach.nutrition.buildStructured.addWeek')}</Text>
      </Pressable>
      <Pressable
        disabled={createMutation.isPending || updateMutation.isPending}
        onPress={() => void savePlan(props, content, createMutation, updateMutation)}
        style={styles.ctaButton}
      >
        <Text style={styles.ctaLabel}>
          {createMutation.isPending || updateMutation.isPending ? t('coach.nutrition.saving') : t('coach.nutrition.save')}
        </Text>
      </Pressable>
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

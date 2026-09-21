import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useDeleteMealMutation, useNutritionMealsQuery } from '../../../data/hooks/useNutrition';
import { styles } from './nutrition.styles';

type Props = {
  mealId: string;
  onBack: () => void;
};

export function MealDetailScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const mealsQuery = useNutritionMealsQuery();
  const deleteMutation = useDeleteMealMutation();
  const meal = mealsQuery.data?.find((item) => item.id === props.mealId);

  if (mealsQuery.isLoading) {
    return <Text style={styles.empty}>{t('coach.nutrition.loading')}</Text>;
  }
  if (!meal) {
    return (
      <View style={styles.container}>
        <Pressable onPress={props.onBack} style={styles.backButton}>
          <Text style={styles.backLabel}>{t('common.back')}</Text>
        </Pressable>
        <Text style={styles.empty}>{t('coach.nutrition.meals.notFound')}</Text>
      </View>
    );
  }

  const totals = meal.ingredients.reduce(
    (acc, item) => {
      const factor = item.amountGrams / 100;
      return {
        calories: acc.calories + (item.food.caloriesKcal ?? 0) * factor,
        carbs: acc.carbs + (item.food.carbsG ?? 0) * factor,
        fat: acc.fat + (item.food.fatG ?? 0) * factor,
        protein: acc.protein + (item.food.proteinG ?? 0) * factor,
      };
    },
    { calories: 0, carbs: 0, fat: 0, protein: 0 },
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={props.onBack} style={styles.backButton}>
        <Text style={styles.backLabel}>{t('common.back')}</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{meal.name}</Text>
      <Text style={styles.cardMuted}>
        {t(`coach.nutrition.categories.${meal.category}`, { defaultValue: meal.category })}
      </Text>
      {meal.notes ? <Text style={styles.cardMuted}>{meal.notes}</Text> : null}
      <View style={styles.macroRow}>
        <View style={styles.macroBar}>
          <Text style={styles.macroLabel}>{t('coach.nutrition.macros.calories')}</Text>
          <Text style={styles.macroValue}>{Math.round(totals.calories)}</Text>
        </View>
        <View style={styles.macroBar}>
          <Text style={styles.macroLabel}>{t('coach.nutrition.macros.protein')}</Text>
          <Text style={styles.macroValue}>{t('coach.nutrition.macros.grams', { value: Math.round(totals.protein) })}</Text>
        </View>
        <View style={styles.macroBar}>
          <Text style={styles.macroLabel}>{t('coach.nutrition.macros.carbs')}</Text>
          <Text style={styles.macroValue}>{t('coach.nutrition.macros.grams', { value: Math.round(totals.carbs) })}</Text>
        </View>
        <View style={styles.macroBar}>
          <Text style={styles.macroLabel}>{t('coach.nutrition.macros.fat')}</Text>
          <Text style={styles.macroValue}>{t('coach.nutrition.macros.grams', { value: Math.round(totals.fat) })}</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>{t('coach.nutrition.meals.ingredients')}</Text>
      {meal.ingredients.map((item) => (
        <View key={`${item.foodId}-${item.sortOrder}`} style={styles.card}>
          <Text style={styles.cardTitle}>{item.food.name}</Text>
          <Text style={styles.cardMuted}>{t('coach.nutrition.meals.amountGrams', { grams: item.amountGrams })}</Text>
        </View>
      ))}
      <Pressable
        disabled={deleteMutation.isPending}
        onPress={() => void deleteMeal(props, deleteMutation)}
        style={[styles.secondaryButton, { backgroundColor: '#fee2e2' }]}
      >
        <Text style={[styles.secondaryLabel, { color: '#ef4444' }]}>{t('coach.nutrition.delete')}</Text>
      </Pressable>
    </ScrollView>
  );
}

async function deleteMeal(props: Props, deleteMutation: ReturnType<typeof useDeleteMealMutation>): Promise<void> {
  await deleteMutation.mutateAsync(props.mealId);
  props.onBack();
}

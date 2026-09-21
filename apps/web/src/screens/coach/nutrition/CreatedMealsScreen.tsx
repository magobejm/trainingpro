import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text } from 'react-native';
import { useNutritionMealsQuery } from '../../../data/hooks/useNutrition';
import { styles } from './nutrition.styles';

type Props = {
  onBack: () => void;
  onCreate: () => void;
  onOpenMeal: (mealId: string) => void;
};

export function CreatedMealsScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const mealsQuery = useNutritionMealsQuery();
  const meals = mealsQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={props.onBack} style={styles.backButton}>
        <Text style={styles.backLabel}>{t('common.back')}</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{t('coach.nutrition.meals.title')}</Text>
      <Pressable onPress={props.onCreate} style={styles.ctaButton}>
        <Text style={styles.ctaLabel}>{t('coach.nutrition.meals.create')}</Text>
      </Pressable>
      {mealsQuery.isLoading ? <Text style={styles.empty}>{t('coach.nutrition.loading')}</Text> : null}
      {mealsQuery.isError ? <Text style={styles.empty}>{t('coach.nutrition.error')}</Text> : null}
      {meals.length === 0 && !mealsQuery.isLoading ? (
        <Text style={styles.empty}>{t('coach.nutrition.meals.empty')}</Text>
      ) : null}
      {meals.map((meal) => (
        <Pressable key={meal.id} onPress={() => props.onOpenMeal(meal.id)} style={styles.card}>
          <Text style={styles.cardTitle}>{meal.name}</Text>
          <Text style={styles.cardMuted}>
            {t('coach.nutrition.meals.cardSummary', {
              category: t(`coach.nutrition.categories.${meal.category}`, { defaultValue: meal.category }),
              count: meal.ingredients.length,
            })}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

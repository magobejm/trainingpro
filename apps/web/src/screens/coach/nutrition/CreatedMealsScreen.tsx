import { EmptyIllustration } from '../../../components/EmptyIllustrations';
import { LoadingState } from '../../../components/AsyncStatus';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text } from 'react-native';
import { useNutritionMealsQuery } from '../../../data/hooks/useNutrition';
import { styles } from './nutrition.styles';
import { Button, EmptyState } from '@trainerpro/ui';

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
      <Button label={t('common.back')} onPress={props.onBack} size="sm" style={styles.backButton} variant="secondary" />
      <Text style={styles.headerTitle}>{t('coach.nutrition.meals.title')}</Text>
      <Button label={t('coach.nutrition.meals.create')} onPress={props.onCreate} style={styles.ctaButton} />
      {mealsQuery.isLoading ? <LoadingState label={t('coach.nutrition.loading')} /> : null}
      {mealsQuery.isError ? <EmptyState title={t('coach.nutrition.error')} /> : null}
      {meals.length === 0 && !mealsQuery.isLoading ? (
        <EmptyState icon={<EmptyIllustration kind={'library'} />}
          actionLabel={t('coach.nutrition.meals.create')}
          onAction={props.onCreate}
          title={t('coach.nutrition.meals.empty')}
        />
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

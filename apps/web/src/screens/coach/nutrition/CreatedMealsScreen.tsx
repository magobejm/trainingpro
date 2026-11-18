import { EmptyIllustration } from '../../../components/EmptyIllustrations';
import { LoadingState } from '../../../components/AsyncStatus';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CopyTarget } from '../../../data/hooks/useCopyLibraryItem';
import { CopyItemModal } from '../components/CopyItemModal';
import { Pressable, ScrollView, Text } from 'react-native';
import { useNutritionMealsQuery } from '../../../data/hooks/useNutrition';
import type { Crumb } from '../../../layout/crumbs';
import { NutritionCrumbBar } from './nutrition-crumbs';
import { styles } from './nutrition.styles';
import { Button, EmptyState } from '@trainerpro/ui';

type Props = {
  crumbs: Crumb[];
  onCreate: () => void;
  onOpenMeal: (mealId: string) => void;
};

export function CreatedMealsScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const mealsQuery = useNutritionMealsQuery();
  const [copyTarget, setCopyTarget] = useState<CopyTarget | null>(null);
  const meals = mealsQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <NutritionCrumbBar crumbs={props.crumbs} label={t('app.breadcrumb')} />
      <Text style={styles.headerTitle}>{t('coach.nutrition.meals.title')}</Text>
      <Button label={t('coach.nutrition.meals.create')} onPress={props.onCreate} style={styles.ctaButton} />
      {mealsQuery.isLoading ? <LoadingState label={t('coach.nutrition.loading')} /> : null}
      {mealsQuery.isError ? <EmptyState title={t('coach.nutrition.error')} /> : null}
      {meals.length === 0 && !mealsQuery.isLoading ? (
        <EmptyState
          icon={<EmptyIllustration kind={'library'} />}
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
          <Button
            label={t('coach.library.copy.action')}
            onPress={() => setCopyTarget({ id: meal.id, kind: 'meal', name: meal.name })}
            size="sm"
            style={styles.addButton}
            variant="secondary"
          />
        </Pressable>
      ))}
      <CopyItemModal onClose={() => setCopyTarget(null)} target={copyTarget} />
    </ScrollView>
  );
}

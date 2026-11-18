import { LoadingState } from '../../../components/AsyncStatus';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CopyTarget } from '../../../data/hooks/useCopyLibraryItem';
import { DeleteItemModal } from '../components/DeleteItemModal';
import { CopyItemModal } from '../components/CopyItemModal';
import { formatLibraryDeleteError } from '../library-delete';
import { ScrollView, Text, View } from 'react-native';
import { useDeleteMealMutation, useNutritionMealsQuery } from '../../../data/hooks/useNutrition';
import type { Crumb } from '../../../layout/crumbs';
import { ConsiderationBadges } from './ConsiderationBadges';
import { NutritionCrumbBar } from './nutrition-crumbs';
import { styles } from './nutrition.styles';
import { Button, EmptyState, useToast } from '@trainerpro/ui';

type Props = {
  crumbs: Crumb[];
  mealId: string;
  onDeleted: () => void;
};

export function MealDetailScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const mealsQuery = useNutritionMealsQuery();
  const deleteMutation = useDeleteMealMutation();
  const toast = useToast();
  const [copyTarget, setCopyTarget] = useState<CopyTarget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<null | string>(null);
  const askDelete = () => {
    setDeleteError(null);
    setConfirmDelete(true);
  };
  const meal = mealsQuery.data?.find((item) => item.id === props.mealId);

  if (mealsQuery.isLoading) {
    return <LoadingState label={t('coach.nutrition.loading')} />;
  }
  if (!meal) {
    return (
      <View style={styles.container}>
        <NutritionCrumbBar crumbs={props.crumbs} label={t('app.breadcrumb')} />
        <EmptyState title={t('coach.nutrition.meals.notFound')} />
      </View>
    );
  }

  const totals = sumMacros(meal.ingredients);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <NutritionCrumbBar crumbs={props.crumbs} label={t('app.breadcrumb')} />
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
      <ConsiderationBadges items={meal.considerations} t={t} />
      <Text style={styles.sectionTitle}>{t('coach.nutrition.meals.ingredients')}</Text>
      {meal.ingredients.map((item) => (
        <View key={`${item.foodId}-${item.sortOrder}`} style={styles.card}>
          <Text style={styles.cardTitle}>{item.food.name}</Text>
          <Text style={styles.cardMuted}>{t('coach.nutrition.meals.amountGrams', { grams: item.amountGrams })}</Text>
        </View>
      ))}
      <Button
        label={t('coach.library.copy.action')}
        onPress={() => setCopyTarget({ id: meal.id, kind: 'meal', name: meal.name })}
        style={styles.addButton}
        variant="secondary"
      />
      <Button
        label={t('coach.nutrition.delete')}
        loading={deleteMutation.isPending}
        onPress={askDelete}
        style={styles.deleteButton}
        variant="danger"
      />
      <CopyItemModal onClose={() => setCopyTarget(null)} target={copyTarget} />
      <DeleteItemModal
        error={deleteError}
        isLoading={deleteMutation.isPending}
        name={meal.name}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(props.mealId, {
            onError: (error) => setDeleteError(formatLibraryDeleteError(error, meal.name, t)),
            onSuccess: () => {
              toast.success(t('coach.nutrition.meals.deleted'));
              props.onDeleted();
            },
          })
        }
        visible={confirmDelete}
      />
    </ScrollView>
  );
}

type MealIngredients = NonNullable<ReturnType<typeof useNutritionMealsQuery>['data']>[number]['ingredients'];

function sumMacros(ingredients: MealIngredients) {
  return ingredients.reduce(
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
}

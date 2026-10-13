import { QueryResult } from '../../../components/AsyncStatus';
import { colors } from '@trainerpro/ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SearchBar } from '@trainerpro/ui';
import { Apple, ClipboardList } from 'lucide-react';
import { useLibraryFoodsQuery } from '../../../data/hooks/useLibraryQuery';
import { styles } from './nutrition.styles';

type Props = {
  onOpenCreatePlan: () => void;
  onOpenFoodDetail: (foodId: string) => void;
  onOpenMeals: () => void;
  onQueryChange: (query: string) => void;
  query: string;
};

export function NutritionHubView(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const foodsQuery = useLibraryFoodsQuery({ query: props.query });
  const foods = foodsQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('coach.nutrition.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('coach.nutrition.subtitle')}</Text>
      </View>
      <View style={styles.actionRow}>
        <Pressable onPress={props.onOpenMeals} style={styles.actionCircle}>
          <View style={styles.iconCircle}>
            <Apple color={colors.primary} size={24} />
          </View>
          <Text style={styles.actionCircleLabel}>{t('coach.nutrition.hub.createdMeals')}</Text>
        </Pressable>
        <Pressable onPress={props.onOpenCreatePlan} style={styles.actionCircle}>
          <View style={styles.iconCircle}>
            <ClipboardList color={colors.primary} size={24} />
          </View>
          <Text style={styles.actionCircleLabel}>{t('coach.nutrition.hub.createPlan')}</Text>
        </Pressable>
      </View>
      <View style={styles.searchCard}>
        <Text style={styles.sectionTitle}>{t('coach.nutrition.hub.foodSearch')}</Text>
        <SearchBar
          onChangeText={props.onQueryChange}
          placeholder={t('coach.nutrition.hub.foodSearchPlaceholder')}
          value={props.query}
        />
        <QueryResult
          emptyIllustration={'library'} emptyTitle={t('coach.nutrition.hub.noFoods')}
          hasActiveFilter={Boolean(props.query.trim())} itemCount={foods.length}
          isLoading={foodsQuery.isLoading} isError={foodsQuery.isError} error={foodsQuery.error}
          onRetry={() => void foodsQuery.refetch()} onClearFilters={() => props.onQueryChange('')} skeleton={'rows'}
        />
        {foods.slice(0, 12).map((food) => (
          <Pressable key={food.id} onPress={() => props.onOpenFoodDetail(food.id)} style={styles.listItem}>
            <Text style={styles.cardTitle}>{food.name}</Text>
            <Text style={styles.cardMuted}>
              {[
                food.caloriesKcal != null ? `${food.caloriesKcal} kcal` : null,
                food.proteinG != null ? `P ${food.proteinG}g` : null,
                food.carbsG != null ? `C ${food.carbsG}g` : null,
                food.fatG != null ? `F ${food.fatG}g` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

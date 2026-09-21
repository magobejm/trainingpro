import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SearchBar } from '@trainerpro/ui';
import { Apple, ClipboardList } from 'lucide-react';
import { useLibraryFoodsQuery } from '../../../data/hooks/useLibraryQuery';
import { COLORS, styles } from './nutrition.styles';

type Props = {
  onOpenCreatePlan: () => void;
  onOpenFoodDetail: (foodId: string) => void;
  onOpenMeals: () => void;
};

export function NutritionHubView(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const foodsQuery = useLibraryFoodsQuery({ query });
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
            <Apple color={COLORS.accent} size={24} />
          </View>
          <Text style={styles.actionCircleLabel}>{t('coach.nutrition.hub.createdMeals')}</Text>
        </Pressable>
        <Pressable onPress={props.onOpenCreatePlan} style={styles.actionCircle}>
          <View style={styles.iconCircle}>
            <ClipboardList color={COLORS.accent} size={24} />
          </View>
          <Text style={styles.actionCircleLabel}>{t('coach.nutrition.hub.createPlan')}</Text>
        </Pressable>
      </View>
      <View style={styles.searchCard}>
        <Text style={styles.sectionTitle}>{t('coach.nutrition.hub.foodSearch')}</Text>
        <SearchBar onChangeText={setQuery} placeholder={t('coach.nutrition.hub.foodSearchPlaceholder')} value={query} />
        {foodsQuery.isLoading ? <Text style={styles.empty}>{t('coach.nutrition.loading')}</Text> : null}
        {foods.length === 0 && !foodsQuery.isLoading ? (
          <Text style={styles.empty}>{t('coach.nutrition.hub.noFoods')}</Text>
        ) : null}
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

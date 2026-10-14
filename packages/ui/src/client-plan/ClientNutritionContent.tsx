import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ClientNutrition, MealCategoryGroup, PlanSetupData } from '@trainerpro/shared';
import { ConsiderationBadges } from './ConsiderationBadges';
import { LIGHT } from './light';
export function ClientNutritionMacrosCard({
  setup,
  t,
}: {
  setup: PlanSetupData;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.macrosCard}>
      <Text style={styles.macrosTitle}>{t('client.nutrition.macrosTitle')}</Text>
      <View style={styles.macrosRow}>
        {setup.tdee != null ? (
          <MacroPill label={t('client.nutrition.tdee')} value={`${Math.round(setup.tdee)} kcal`} />
        ) : null}
        {setup.targetCalories != null ? (
          <MacroPill label={t('client.nutrition.target')} value={`${Math.round(setup.targetCalories)} kcal`} />
        ) : null}
      </View>
      <View style={styles.macrosRow}>
        {setup.proteinG != null ? (
          <MacroPill label={t('client.nutrition.protein')} value={`${setup.proteinG} g`} accent={LIGHT.indigo} />
        ) : null}
        {setup.carbsG != null ? (
          <MacroPill label={t('client.nutrition.carbs')} value={`${setup.carbsG} g`} accent={LIGHT.accent} />
        ) : null}
        {setup.fatG != null ? (
          <MacroPill label={t('client.nutrition.fat')} value={`${setup.fatG} g`} accent={LIGHT.orange} />
        ) : null}
      </View>
    </View>
  );
}

function MacroPill({
  accent = LIGHT.bgNavy,
  label,
  value,
}: {
  accent?: string;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={[styles.macroPill, { borderColor: accent }]}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  );
}

export function ClientNutritionMealGroups({
  foods,
  groups,
  meals,
  t,
}: {
  foods?: ClientNutrition['foods'];
  groups: MealCategoryGroup[];
  meals?: ClientNutrition['meals'];
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  return (
    <View style={styles.mealsSection}>
      <Text style={styles.sectionTitle}>{t('client.nutrition.mealsTitle')}</Text>
      {groups.map((group) => (
        <View key={group.category} style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>{formatCategoryLabel(group.category, t)}</Text>
          {group.items.map((item, index) => (
            <View key={`${group.category}-${index}`} style={styles.mealRow}>
              <Text style={styles.mealName}>{item.label}</Text>
              {item.sublabel ? <Text style={styles.mealMeta}>{item.sublabel}</Text> : null}
              <ConsiderationBadges items={lookupConsiderations(item, meals, foods)} t={t} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function lookupConsiderations(
  item: MealCategoryGroup['items'][number],
  meals: ClientNutrition['meals'],
  foods: ClientNutrition['foods'],
) {
  if (item.mealId) {
    return meals?.find((meal) => meal.id === item.mealId)?.considerations ?? [];
  }
  if (item.foodId) {
    return foods?.find((food) => food.id === item.foodId)?.considerations ?? [];
  }
  return [];
}

function formatCategoryLabel(category: string, t: (key: string) => string): string {
  const key = `client.nutrition.category.${category}`;
  const translated = t(key);
  return translated === key ? category : translated;
}

const styles = StyleSheet.create({
  categoryCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
    padding: 16,
  },
  categoryTitle: {
    color: LIGHT.accentDark,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 160, padding: 24 },
  container: { flex: 1, backgroundColor: LIGHT.bg },
  content: { paddingBottom: 32 },
  empty: { color: LIGHT.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: LIGHT.error, fontSize: 14, textAlign: 'center' },
  hint: {
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 12,
  },
  hintText: { color: LIGHT.accentDark, fontSize: 12, textAlign: 'center' },
  macroLabel: { color: LIGHT.textMuted, fontSize: 11, fontWeight: '600' },
  macroPill: {
    backgroundColor: LIGHT.bgSoft,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minWidth: '30%',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  macroValue: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '800' },
  macrosCard: {
    backgroundColor: LIGHT.bgNavy,
    borderRadius: LIGHT.radiusXl,
    gap: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 16,
  },
  macrosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  macrosTitle: { color: LIGHT.textOnNavy, fontSize: 14, fontWeight: '800' },
  mealMeta: { color: LIGHT.textMuted, fontSize: 12 },
  mealName: { color: LIGHT.textStrong, flex: 1, fontSize: 14, fontWeight: '600' },
  mealRow: {
    borderTopColor: LIGHT.border,
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 8,
  },
  mealsSection: { paddingHorizontal: 16 },
  planDescription: { color: LIGHT.textMuted, fontSize: 13, marginBottom: 12, marginHorizontal: 16 },
  planName: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800', marginBottom: 4, marginHorizontal: 16 },
  sectionTitle: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  subtitle: { color: LIGHT.textMuted, fontSize: 13, marginBottom: 12, paddingHorizontal: 16 },
  toggleBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  toggleBtnActive: {
    backgroundColor: LIGHT.accent,
    borderColor: LIGHT.accent,
  },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16, marginHorizontal: 16 },
  toggleText: { color: LIGHT.textMuted, fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: LIGHT.textOnNavy },
});

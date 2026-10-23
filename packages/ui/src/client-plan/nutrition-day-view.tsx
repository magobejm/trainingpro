import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DayMealMacros, MacroComparison } from '@trainerpro/shared';
import { LIGHT } from './light';

const MACRO_LABEL: Record<MacroComparison['key'], string> = {
  caloriesKcal: 'client.nutrition.target',
  carbsG: 'client.nutrition.carbs',
  fatG: 'client.nutrition.fat',
  proteinG: 'client.nutrition.protein',
};

export function MacroTargetBars({
  comparison,
  t,
}: {
  comparison: MacroComparison[];
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  return (
    <View style={styles.card}>
      {comparison.map((item) => (
        <MacroBar item={item} key={item.key} t={t} />
      ))}
    </View>
  );
}

export function DayMealsList({
  meals,
  renderExtra,
  t,
}: {
  meals: DayMealMacros[];
  renderExtra?: (meal: DayMealMacros) => React.ReactNode;
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  return (
    <View style={styles.list}>
      {meals.map((meal) => (
        <MealBlock extra={renderExtra?.(meal)} key={meal.key} meal={meal} t={t} />
      ))}
    </View>
  );
}

function MacroBar({
  item,
  t,
}: {
  item: MacroComparison;
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  const width = Math.min(item.percent ?? 0, 100);
  return (
    <View style={styles.barBlock}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{t(MACRO_LABEL[item.key])}</Text>
        <Text style={styles.barValue}>{formatMacro(item, t)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${width}%` }]} />
      </View>
    </View>
  );
}

function MealBlock({
  extra,
  meal,
  t,
}: {
  extra?: React.ReactNode;
  meal: DayMealMacros;
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  return (
    <View style={styles.meal}>
      <Text style={styles.mealTitle}>{mealTitle(meal, t)}</Text>
      {meal.items.map((item, index) => (
        <Text key={`${meal.key}-${index}`} style={styles.item}>
          {itemLine(item.name, item.amountGrams, item.totals.caloriesKcal, t)}
        </Text>
      ))}
      <Text style={styles.mealTotal}>{t('client.nutrition.mealKcal', { value: Math.round(meal.totals.caloriesKcal) })}</Text>
      {extra}
    </View>
  );
}

function mealTitle(meal: DayMealMacros, t: (key: string) => string): string {
  const category = meal.category ? t(`client.nutrition.category.${meal.category}`) : meal.name;
  const translated = meal.category && category === `client.nutrition.category.${meal.category}` ? meal.name : category;
  return meal.time ? `${translated} · ${meal.time}` : translated;
}

function itemLine(
  name: string,
  grams: number | undefined,
  kcal: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const amount = grams != null ? t('client.nutrition.grams', { value: grams }) : '';
  return [name, amount, t('client.nutrition.mealKcal', { value: Math.round(kcal) })].filter(Boolean).join(' · ');
}

function formatMacro(item: MacroComparison, t: (key: string, options?: Record<string, unknown>) => string): string {
  const value = item.key === 'caloriesKcal' ? Math.round(item.value) : item.value;
  const unit = item.key === 'caloriesKcal' ? t('client.nutrition.kcalUnit') : t('client.nutrition.gramsUnit');
  if (item.target == null || item.percent == null) return `${value} ${unit}`;
  const target = item.key === 'caloriesKcal' ? Math.round(item.target) : item.target;
  return t('client.nutrition.ofTarget', { percent: item.percent, target, unit, value });
}

const styles = StyleSheet.create({
  barBlock: { gap: 4 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '700' },
  barValue: { color: LIGHT.textMuted, fontSize: 12 },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 16,
  },
  fill: { backgroundColor: LIGHT.accent, borderRadius: LIGHT.radiusFull, height: 8 },
  item: { color: LIGHT.textMuted, fontSize: 13 },
  list: { gap: 12, paddingHorizontal: 16 },
  meal: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  mealTitle: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '800' },
  mealTotal: { color: LIGHT.accentDark, fontSize: 12, fontWeight: '700' },
  track: { backgroundColor: LIGHT.bgSoft, borderRadius: LIGHT.radiusFull, height: 8, overflow: 'hidden' },
});

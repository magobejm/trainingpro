import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatFoodAmount, type DayMealMacros, type MacroComparison } from '@trainerpro/shared';
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
  onPressItem,
  renderExtra,
  showTitle = true,
  t,
}: {
  meals: DayMealMacros[];
  onPressItem?: (item: DayMealMacros['items'][number]) => void;
  renderExtra?: (meal: DayMealMacros) => React.ReactNode;
  showTitle?: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  return (
    <View style={styles.list}>
      {meals.map((meal) => (
        <MealBlock
          extra={renderExtra?.(meal)}
          key={meal.key}
          meal={meal}
          onPressItem={onPressItem}
          showTitle={showTitle}
          t={t}
        />
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
  const over = (item.percent ?? 0) > 105;
  return (
    <View style={styles.barBlock}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{t(MACRO_LABEL[item.key])}</Text>
        <Text style={styles.barValue}>{formatMacro(item, t)}</Text>
      </View>
      <View style={styles.track}>
        <View
          accessibilityLabel={over ? t('client.nutrition.overTarget') : undefined}
          style={[styles.fill, over ? styles.fillOver : null, { width: `${width}%` }]}
        />
      </View>
    </View>
  );
}

function MealBlock({
  extra,
  meal,
  onPressItem,
  showTitle,
  t,
}: {
  extra?: React.ReactNode;
  meal: DayMealMacros;
  onPressItem?: (item: DayMealMacros['items'][number]) => void;
  showTitle: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  return (
    <View style={styles.meal}>
      {showTitle ? <Text style={styles.mealTitle}>{mealTitle(meal, t)}</Text> : null}
      {meal.items.map((item, index) => (
        <Pressable key={`${meal.key}-${index}`} onPress={onPressItem ? () => onPressItem(item) : undefined}>
          <Text style={styles.item}>{itemLine(item, t)}</Text>
        </Pressable>
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
  item: DayMealMacros['items'][number],
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const amount = formatFoodAmount(item.amountGrams, item.servingUnit, t);
  const kcal = t('client.nutrition.mealKcal', { value: Math.round(item.totals.caloriesKcal) });
  return [item.name, amount, kcal].filter(Boolean).join(' · ');
}

function formatMacro(item: MacroComparison, t: (key: string, options?: Record<string, unknown>) => string): string {
  const value = Math.round(item.value);
  const unit = item.key === 'caloriesKcal' ? t('client.nutrition.kcalUnit') : t('client.nutrition.gramsUnit');
  if (item.target == null || item.percent == null) return `${value} ${unit}`;
  return t('client.nutrition.ofTarget', { percent: item.percent, target: Math.round(item.target), unit, value });
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
  fillOver: { backgroundColor: LIGHT.orange },
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

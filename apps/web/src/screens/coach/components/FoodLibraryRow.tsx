import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FoodLibraryItem } from '../../../data/hooks/useLibraryQuery';

type Props = {
  expanded: boolean;
  item: FoodLibraryItem;
  onToggle: () => void;
  t: (key: string) => string;
};

export function FoodLibraryRow(props: Props): React.JSX.Element {
  const scopeKey = readScopeKey(props.item.scope);
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>{props.item.name}</Text>
          <Text style={styles.meta}>
            {props.t(`coach.library.scope.${scopeKey}`)}
            {props.t('coach.library.separator')}
            {readServingUnitLabel(props.item.servingUnit, props.t)}
          </Text>
        </View>
        <Pressable onPress={props.onToggle} style={styles.button}>
          <Text style={styles.buttonLabel}>
            {props.expanded
              ? props.t('coach.library.foods.actions.hideDetail')
              : props.t('coach.library.foods.actions.viewDetail')}
          </Text>
        </Pressable>
      </View>
      {props.expanded ? <FoodDetail item={props.item} t={props.t} /> : null}
    </View>
  );
}

function readScopeKey(scope: string): 'coach' | 'global' {
  return scope.trim().toLowerCase() === 'coach' ? 'coach' : 'global';
}

function FoodDetail(props: {
  item: FoodLibraryItem;
  t: (key: string) => string;
}): React.JSX.Element {
  const lines = buildDetailLines(props.item, props.t);
  return (
    <View style={styles.detail}>
      {lines.map((line) => (
        <DetailLine key={line.label} label={line.label} value={line.value} />
      ))}
    </View>
  );
}

function buildDetailLines(item: FoodLibraryItem, t: (key: string) => string) {
  return [
    { label: t('coach.library.foods.detail.calories'), value: readValue(item.caloriesKcal, t) },
    { label: t('coach.library.foods.detail.protein'), value: readValue(item.proteinG, t) },
    { label: t('coach.library.foods.detail.carbs'), value: readValue(item.carbsG, t) },
    { label: t('coach.library.foods.detail.fat'), value: readValue(item.fatG, t) },
    { label: t('coach.library.foods.detail.type'), value: readTypeLabel(item.foodType, t) },
    { label: t('coach.library.foods.detail.category'), value: readCategoryLabel(item.foodCategory, t) },
    { label: t('coach.library.foods.detail.notes'), value: item.notes ?? t('coach.library.foods.detail.empty') },
  ];
}

function readValue(value: null | number, t: (key: string) => string): string {
  if (value === null || value === undefined) {
    return t('coach.library.foods.detail.empty');
  }
  return `${value}`;
}

function readServingUnitLabel(value: null | string, t: (key: string) => string): string {
  if (!value) {
    return '-';
  }
  return t(`coach.library.foods.filters.unit.${value}`);
}

function readTypeLabel(value: null | string, t: (key: string) => string): string {
  if (!value) {
    return t('coach.library.foods.detail.empty');
  }
  return t(`coach.library.foods.filters.type.${value}`);
}

function readCategoryLabel(value: null | string, t: (key: string) => string): string {
  if (!value) {
    return t('coach.library.foods.detail.empty');
  }
  return t(`coach.library.foods.filters.category.${value}`);
}

function DetailLine(props: { label: string; value: string }): React.JSX.Element {
  return (
    <View>
      <Text style={styles.detailLabel}>{props.label}</Text>
      <Text style={styles.detailValue}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#e8f0fb',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
  },
  buttonLabel: {
    color: '#334e70',
    fontSize: 11,
    fontWeight: '700',
  },
  detail: {
    backgroundColor: '#f6f9ff',
    borderColor: '#dce6f3',
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    marginTop: 10,
    padding: 10,
  },
  detailLabel: {
    color: '#334e70',
    fontSize: 11,
    fontWeight: '700',
  },
  detailValue: {
    color: '#1a2536',
    fontSize: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: '#627285',
    fontSize: 12,
  },
  row: {
    borderBottomColor: '#e2e8f2',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  title: {
    color: '#0e1a2f',
    fontSize: 15,
    fontWeight: '700',
  },
  titleBox: {
    gap: 4,
  },
});

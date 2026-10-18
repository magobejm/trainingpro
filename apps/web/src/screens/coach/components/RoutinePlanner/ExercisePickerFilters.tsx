import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, colors, fontSize, space } from '@trainerpro/ui';
import { useAllCatalogsQuery, type CatalogItem } from '../../../../data/hooks/useUnifiedLibraryQuery';
import { TagMultiSelect } from '../TagMultiSelect';
import { PICKER_FILTERS, EMPTY_PICKER_FILTERS, type PickerFilters } from './ExercisePickerModal.filters';
import type { BlockType } from '../../RoutinePlanner.types';

export function ExercisePickerFilters({
  type,
  value,
  onChange,
  t,
}: {
  type: BlockType;
  value: PickerFilters;
  onChange: (filters: PickerFilters) => void;
  t: (key: string) => string;
}) {
  const catalogs = useAllCatalogsQuery();
  const [open, setOpen] = useState<'category' | 'equipment' | null>(null);
  useEffect(() => setOpen(null), [type]);
  const toggle = (key: keyof PickerFilters, id: string) => {
    const selected = value[key];
    onChange({ ...value, [key]: selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id] });
  };
  const category = PICKER_FILTERS[type].catalog;
  return (
    <View style={styles.panel}>
      {catalogs.isLoading ? (
        <Text style={styles.label}>{t('common.loading')}</Text>
      ) : catalogs.isError ? (
        <View style={styles.error}>
          <Text style={styles.label}>{t('coach.routine.picker.filtersError')}</Text>
          <Button label={t('common.retry')} variant="secondary" size="sm" onPress={() => void catalogs.refetch()} />
        </View>
      ) : (
        <View style={styles.row}>
          <View style={[styles.field, styles.categoryField]}>
            <Text style={styles.label}>{t(`coach.library.categories.${category}`)}</Text>
            <TagMultiSelect
              options={options(catalogs.data?.[category])}
              selectedIds={value.categoryIds}
              onToggle={(id) => toggle('categoryIds', id)}
              expanded={open === 'category'}
              setExpanded={(expanded) => setOpen(expanded ? 'category' : null)}
              placeholder={t('coach.library.sidebar.categoryPlaceholder')}
              doneLabel={t('coach.library.sidebar.doneSelecting')}
              zIndex={60}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('coach.library.sidebar.equipmentTitle')}</Text>
            <TagMultiSelect
              options={options(catalogs.data?.equipmentTypes)}
              selectedIds={value.equipmentIds}
              onToggle={(id) => toggle('equipmentIds', id)}
              expanded={open === 'equipment'}
              setExpanded={(expanded) => setOpen(expanded ? 'equipment' : null)}
              placeholder={t('coach.library.sidebar.equipmentPlaceholder')}
              doneLabel={t('coach.library.sidebar.doneSelecting')}
              zIndex={50}
            />
          </View>
        </View>
      )}
      {value.categoryIds.length || value.equipmentIds.length ? (
        <Button
          label={t('coach.library.sidebar.clearFilters')}
          size="sm"
          variant="ghost"
          onPress={() => {
            onChange(EMPTY_PICKER_FILTERS);
            setOpen(null);
          }}
        />
      ) : null}
    </View>
  );
}

function options(items: CatalogItem[] = []) {
  return [...items]
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    .map((item) => ({ value: item.id, label: item.label }));
}
const styles = StyleSheet.create({
  panel: { gap: space.sm, zIndex: 5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, zIndex: 5 },
  field: { flexBasis: 220, flexGrow: 1, gap: space.xs },
  categoryField: { zIndex: 1 },
  label: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  error: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});

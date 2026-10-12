import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Pressable, ScrollView } from 'react-native';
import { Dumbbell, Heart, Zap, Wind, Trophy, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QueryResult } from '../../components/AsyncStatus';
import { UnifiedExerciseItem, UnifiedExercisesFilter } from '../../data/hooks/useUnifiedLibraryQuery';
import { styles } from './UnifiedExerciseLibraryScreen.styles';
import { resolvePlaceholder } from './components/LibraryMediaViewer';
import { LibraryScreenState } from './useLibraryScreenState';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { UnifiedExerciseModal } from './UnifiedExerciseModal';
import { UnifiedExerciseDetailModal } from './UnifiedExerciseDetailModal';
import { TagMultiSelect, type TagMultiSelectOption } from './components/TagMultiSelect';
import { Button, IconButton, TextField, colors, useBreakpoint } from '@trainerpro/ui';

const C_BLUE = colors.primary;
const C_WHITE = colors.surface;
const REMODE_CVR = 'cover' as const;
const REMODE_CNT = 'contain' as const;

export type CategoryKey =
  | 'muscleGroups'
  | 'cardioMethodTypes'
  | 'isometricTypes'
  | 'plioTypes'
  | 'mobilityTypes'
  | 'sportTypes';

export type CategoryMeta = {
  key: CategoryKey;
  labelKey: string;
  filterKey: keyof UnifiedExercisesFilter;
  icon: React.ReactNode;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    key: 'muscleGroups',
    labelKey: 'coach.library.categories.muscleGroups',
    filterKey: 'muscleGroupIds',
    icon: <Dumbbell size={16} color={C_BLUE} />,
  },
  {
    key: 'cardioMethodTypes',
    labelKey: 'coach.library.categories.cardioMethodTypes',
    filterKey: 'cardioTypeIds',
    icon: <Heart size={16} color={C_BLUE} />,
  },
  {
    key: 'plioTypes',
    labelKey: 'coach.library.categories.plioTypes',
    filterKey: 'plioTypeIds',
    icon: <Zap size={16} color={C_BLUE} />,
  },
  {
    key: 'isometricTypes',
    labelKey: 'coach.library.categories.isometricTypes',
    filterKey: 'isometricTypeIds',
    icon: <Zap size={16} color={C_BLUE} />,
  },
  {
    key: 'sportTypes',
    labelKey: 'coach.library.categories.sportTypes',
    filterKey: 'sportTypeIds',
    icon: <Trophy size={16} color={C_BLUE} />,
  },
  {
    key: 'mobilityTypes',
    labelKey: 'coach.library.categories.mobilityTypes',
    filterKey: 'mobilityTypeIds',
    icon: <Wind size={16} color={C_BLUE} />,
  },
];

export function LibraryHeader({
  search,
  setSearch,
  onNew,
  t,
}: {
  search: string;
  setSearch: (s: string) => void;
  onNew: () => void;
  t: (k: string) => string;
}) {
  const bp = useBreakpoint();
  const stacked = bp === 'sm';
  return (
    <View style={[styles.header, stacked && styles.headerCompact]}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>{t('coach.library.header.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('coach.library.header.subtitle')}</Text>
      </View>
      <View style={[styles.headerRight, stacked && styles.headerRightStacked]}>
        <TextField
          containerStyle={stacked ? styles.searchContainerFluid : styles.searchContainer}
          onChangeText={setSearch}
          placeholder={t('coach.library.search.placeholder')}
          value={search}
        />
        <Button icon={<Plus size={16} color={C_WHITE} />} label={t('coach.library.actions.newExercise')} onPress={onNew} />
      </View>
    </View>
  );
}

function ExerciseCardTags({ tags }: { tags: string[] }) {
  return (
    <View style={styles.cardTags}>
      {tags.slice(0, 3).map((tag, i) => (
        <View key={i} style={i === 0 ? styles.tagPrimary : styles.tagSecondary}>
          <Text style={i === 0 ? styles.tagPrimaryText : styles.tagSecondaryText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

function ExerciseCardActions({
  onEdit,
  onDelete,
  disabled,
  t,
}: {
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
  t: (k: string) => string;
}) {
  return (
    <View style={styles.actionsRow}>
      <IconButton
        accessibilityLabel={t('coach.library.exercises.actions.edit')}
        icon={(color) => <Edit2 size={14} color={color} />}
        onPress={onEdit}
        size={28}
      />
      <IconButton
        accessibilityLabel={t('coach.library.exercises.actions.delete')}
        disabled={disabled}
        icon={(color) => <Trash2 size={14} color={color} />}
        onPress={onDelete}
        size={28}
        tone="danger"
      />
    </View>
  );
}

export type ExerciseCardProps = {
  item: UnifiedExerciseItem;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deletionDisabled: boolean;
  hovered: boolean;
  setHovered: (hovered: boolean) => void;
};

export function ExerciseCard(props: ExerciseCardProps) {
  const { item, onDetail, onEdit, onDelete, deletionDisabled, hovered, setHovered } = props;
  const { t } = useTranslation();
  const coachOwned = item.scope?.trim().toLowerCase() === 'coach';
  const imageUrl = item.mediaUrl || resolvePlaceholder(item.kind === 'exercise' ? 'strength' : item.kind);
  const bp = useBreakpoint();
  return (
    <Pressable
      style={[styles.card, bp === 'md' && styles.cardMd, bp === 'sm' && styles.cardSm]}
      onPress={onDetail}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <View style={styles.cardImage}>
        <Image blurRadius={16} resizeMode={REMODE_CVR} source={{ uri: imageUrl }} style={styles.imageBackdrop} />
        <View style={styles.imageShade} />
        <Image
          resizeMode={REMODE_CNT}
          source={{ uri: imageUrl }}
          style={[styles.cardImageInner, hovered && styles.cardImageInnerHovered]}
        />
      </View>
      <View style={styles.cardContent}>
        <Text numberOfLines={1} style={styles.cardTitle}>
          {item.name}
        </Text>
        <ExerciseCardTags tags={item.tags} />
        {coachOwned && <ExerciseCardActions onEdit={onEdit} onDelete={onDelete} disabled={deletionDisabled} t={t} />}
      </View>
    </Pressable>
  );
}

export function LibrarySidebar({ st }: { st: LibraryScreenState }) {
  const compact = useBreakpoint() !== 'lg';
  return (
    <View style={[styles.sidebar, compact && styles.sidebarCompact]}>
      <Text style={styles.sidebarTitle}>{st.t('coach.library.sidebar.categoriesTitle')}</Text>
      {CATEGORIES.map((cat) => {
        const isExpanded = st.expandedCategory === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryRow, isExpanded && styles.categoryRowActive]}
            onPress={() => st.setExpandedCategory(cat.key)}
          >
            <View style={styles.categoryIcon}>{cat.icon}</View>
            <Text style={[styles.categoryLabel, isExpanded && styles.categoryLabelActive]}>{st.t(cat.labelKey)}</Text>
          </TouchableOpacity>
        );
      })}
      {st.expandedCategory && <LibrarySidebarFilters st={st} />}
    </View>
  );
}

function LibrarySidebarFilters({ st }: { st: LibraryScreenState }) {
  const [openCombo, setOpenCombo] = useState<'category' | 'equipment' | null>(null);
  const catLabel = CATEGORIES.find((c) => c.key === st.expandedCategory)?.labelKey ?? '';

  useEffect(() => {
    setOpenCombo(null);
  }, [st.expandedCategory]);

  const categoryOptions = useMemo((): TagMultiSelectOption[] => {
    const items = [...(st.catalogs?.[st.expandedCategory as CategoryKey] ?? [])];
    return items
      .sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1))
      .map((item) => ({ value: item.id, label: item.label }));
  }, [st.catalogs, st.expandedCategory]);

  const equipmentOptions = useMemo((): TagMultiSelectOption[] => {
    const items = [...(st.catalogs?.equipmentTypes ?? [])];
    return items
      .sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1))
      .map((item) => ({ value: item.id, label: item.label }));
  }, [st.catalogs?.equipmentTypes]);

  const selectedCategoryIds = [...(st.selectedCategoryFilters[st.expandedCategory!] ?? new Set<string>())];

  return (
    <View style={styles.filtersSection}>
      <View style={styles.divider} />
      <Text style={styles.sidebarTitle}>
        {st.t('coach.library.sidebar.filtersTitle')} {st.t(catLabel).toUpperCase()}
      </Text>

      <TagMultiSelect
        options={categoryOptions}
        selectedIds={selectedCategoryIds}
        onToggle={(id) => st.toggleCategoryItem(st.expandedCategory!, id)}
        expanded={openCombo === 'category'}
        setExpanded={(open) => setOpenCombo(open ? 'category' : null)}
        placeholder={st.t('coach.library.sidebar.categoryPlaceholder')}
        doneLabel={st.t('coach.library.sidebar.doneSelecting')}
        zIndex={60}
      />

      <View style={styles.equipmentSubSection}>
        <Text style={styles.equipmentSubLabel}>{st.t('coach.library.sidebar.equipmentTitle')}</Text>
        <TagMultiSelect
          options={equipmentOptions}
          selectedIds={[...st.selectedEquipment]}
          onToggle={st.toggleEquipment}
          expanded={openCombo === 'equipment'}
          setExpanded={(open) => setOpenCombo(open ? 'equipment' : null)}
          placeholder={st.t('coach.library.sidebar.equipmentPlaceholder')}
          doneLabel={st.t('coach.library.sidebar.doneSelecting')}
          zIndex={50}
        />
      </View>

      {st.hasActiveFilters && (
        <Button
          icon={<X size={14} color={colors.primary} />}
          label={st.t('coach.library.sidebar.clearFilters')}
          onPress={st.clearAllFilters}
          size="sm"
          variant="ghost"
        />
      )}
    </View>
  );
}

export function LibraryMainGrid({ st }: { st: LibraryScreenState }) {
  const status = QueryResult({
    emptyMessage: st.t('coach.library.list.emptySubtitle'),
    emptyTitle: st.t('coach.library.list.emptyTitle'),
    error: st.listError,
    hasActiveFilter: st.hasActiveFilters || st.search.trim().length > 0,
    isError: st.isListError,
    isLoading: st.isLoading,
    itemCount: st.exercises?.length ?? 0,
    onRetry: st.refetchList,
  });
  return (
    <ScrollView style={styles.mainContent} contentContainerStyle={styles.mainContentInner}>
      {status ?? (
        <View style={styles.cardGrid}>
          {(st.exercises ?? []).map((item) => (
            <ExerciseCard
              key={`${item.kind}-${item.id}`}
              item={item}
              hovered={st.hoveredCard === item.id}
              setHovered={(h) => st.setHoveredCard(h ? item.id : null)}
              onDetail={() => {
                st.setItemForDetail(item);
                st.setDetailVisible(true);
              }}
              onEdit={() => {
                st.setItemToEdit(item);
                st.setIsModalVisible(true);
              }}
              onDelete={() => {
                st.setDeleteError(null);
                st.setPendingDelete({ id: item.id, kind: item.kind });
              }}
              deletionDisabled={st.deletingId === item.id}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export function LibraryModals({ st }: { st: LibraryScreenState }) {
  return (
    <>
      <ActionConfirmModal
        cancelLabel={st.t('coach.clients.modal.cancel')}
        confirmLabel={st.t('coach.library.exercises.actions.delete')}
        errorMessage={st.deleteError}
        isLoading={Boolean(st.deletingId)}
        message={st.t('coach.library.exercises.actions.deleteConfirm')}
        onCancel={() => {
          st.setDeleteError(null);
          st.setPendingDelete(null);
        }}
        onConfirm={st.confirmDelete}
        title={st.t('coach.library.confirm.title')}
        visible={Boolean(st.pendingDelete)}
      />
      {st.isModalVisible && (
        <UnifiedExerciseModal
          visible={st.isModalVisible}
          onClose={() => st.setIsModalVisible(false)}
          itemToEdit={st.itemToEdit}
          defaultCategory={st.defaultCategory}
        />
      )}
      <UnifiedExerciseDetailModal
        visible={st.detailVisible}
        onClose={() => st.setDetailVisible(false)}
        item={st.itemForDetail}
      />
    </>
  );
}

import React from 'react';
import { View, Text, TouchableOpacity, Image, Pressable, TextInput, ScrollView } from 'react-native';
import { Dumbbell, Heart, Zap, Wind, Trophy, Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { UnifiedExerciseItem, UnifiedExercisesFilter } from '../../data/hooks/useUnifiedLibraryQuery';
import { styles } from './UnifiedExerciseLibraryScreen.styles';
import { resolvePlaceholder } from './components/LibraryMediaViewer';
import { LibraryScreenState } from './useLibraryScreenState';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { UnifiedExerciseModal } from './UnifiedExerciseModal';
import { UnifiedExerciseDetailModal } from './UnifiedExerciseDetailModal';

const C_BLUE = '#2563eb';
const C_GRAY = '#94a3b8';
const C_SLATE = '#64748b';
const C_SLATE_L = '#e2e8f0';
const C_WHITE = '#fff';
const C_RED = '#ef4444';
const REMODE_CVR = 'cover' as const;
const REMODE_CNT = 'contain' as const;

export type CategoryKey = 'muscleGroups' | 'cardioMethodTypes' | 'plioTypes' | 'mobilityTypes' | 'sportTypes';

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
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>{t('coach.library.header.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('coach.library.header.subtitle')}</Text>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.searchContainer}>
          <Search size={16} color={C_GRAY} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('coach.library.search.placeholder')}
            placeholderTextColor={C_GRAY}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.newButton} onPress={onNew}>
          <Plus size={16} color={C_WHITE} />
          <Text style={styles.newButtonText}>{t('coach.library.actions.newExercise')}</Text>
        </TouchableOpacity>
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
}: {
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.actionsRow}>
      <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
        <Edit2 size={12} color={C_GRAY} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, styles.actionDelete]} onPress={onDelete} disabled={disabled}>
        <Trash2 size={12} color={C_RED} />
      </TouchableOpacity>
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
  const coachOwned = item.scope?.trim().toLowerCase() === 'coach';
  const imageUrl = item.mediaUrl || resolvePlaceholder(item.kind === 'exercise' ? 'strength' : item.kind);
  return (
    <Pressable
      style={styles.card}
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
        {coachOwned && <ExerciseCardActions onEdit={onEdit} onDelete={onDelete} disabled={deletionDisabled} />}
      </View>
    </Pressable>
  );
}

export function LibrarySidebar({ st }: { st: LibraryScreenState }) {
  return (
    <View style={styles.sidebar}>
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
  const catLabel = CATEGORIES.find((c) => c.key === st.expandedCategory)?.labelKey ?? '';
  return (
    <View style={styles.filtersSection}>
      <View style={styles.divider} />
      <Text style={styles.sidebarTitle}>
        {st.t('coach.library.sidebar.filtersTitle')} {st.t(catLabel).toUpperCase()}
      </Text>

      <CategoryChipList st={st} />
      <EquipmentChipList st={st} />

      {st.hasActiveFilters && (
        <TouchableOpacity style={styles.clearFilters} onPress={st.clearAllFilters}>
          <X size={14} color={C_SLATE} />
          <Text style={styles.clearFiltersText}>{st.t('coach.library.sidebar.clearFilters')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function CategoryChipList({ st }: { st: LibraryScreenState }) {
  const filters = [...(st.catalogs?.[st.expandedCategory as CategoryKey] ?? [])];

  return (
    <View style={styles.chipContainer}>
      {filters
        .sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1))
        .map((item) => {
          const isSelected = (st.selectedCategoryFilters[st.expandedCategory!] ?? new Set()).has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => st.toggleCategoryItem(st.expandedCategory!, item.id)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

function EquipmentChipList({ st }: { st: LibraryScreenState }) {
  const equipments = [...(st.catalogs?.equipmentTypes ?? [])];
  return (
    <View style={styles.equipmentSubSection}>
      <Text style={styles.equipmentSubLabel}>{st.t('coach.library.sidebar.equipmentTitle')}</Text>
      <View style={styles.chipContainer}>
        {equipments
          .sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1))
          .map((item) => {
            const isSelected = st.selectedEquipment.has(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.chipSmall, isSelected && styles.chipSelected]}
                onPress={() => st.toggleEquipment(item.id)}
              >
                <Text style={[styles.chipTextSmall, isSelected && styles.chipTextSelected]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
  );
}

export function LibraryMainGrid({ st }: { st: LibraryScreenState }) {
  if (st.isLoading) {
    return (
      <ScrollView style={styles.mainContent} contentContainerStyle={styles.mainContentInner}>
        <Text style={styles.loadingText}>{st.t('coach.library.list.loading')}</Text>
      </ScrollView>
    );
  }
  return (
    <ScrollView style={styles.mainContent} contentContainerStyle={styles.mainContentInner}>
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
            onDelete={() => st.setPendingDelete({ id: item.id, kind: item.kind })}
            deletionDisabled={st.deletingId === item.id}
          />
        ))}
      </View>
      {st.exercises?.length === 0 && (
        <View style={styles.emptyState}>
          <Dumbbell size={48} color={C_SLATE_L} />
          <Text style={styles.emptyText}>{st.t('coach.library.list.emptyTitle')}</Text>
          <Text style={styles.emptySubtext}>{st.t('coach.library.list.emptySubtitle')}</Text>
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
        message={st.t('coach.library.exercises.actions.deleteConfirm')}
        onCancel={() => st.setPendingDelete(null)}
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

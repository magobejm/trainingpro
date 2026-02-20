import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FilterChips, SearchBar } from '@trainerpro/ui';
import '../../i18n';
import { useCreateFoodMutation } from '../../data/hooks/useLibraryMutations';
import { useLibraryFoodsQuery } from '../../data/hooks/useLibraryQuery';
import { FoodLibraryRow } from './components/FoodLibraryRow';
import { FoodCreateFields } from './components/LibraryCreateFormFields';
import { LibraryCreateCta } from './components/LibraryCreateCta';
import { LibraryCreateModal } from './components/LibraryCreateModal';
import {
  buildFoodPayload,
  CATEGORY_FILTER_KEYS,
  EMPTY_FOOD_FORM,
  FoodCreateFormState,
  isCategoryFilter,
  isTypeFilter,
  isUnitFilter,
  resolveFoodFormError,
  TYPE_FILTER_KEYS,
  UNIT_FILTER_KEYS,
} from './foods.helpers';
import { createFieldSetter } from './libraryCreateForm.utils';

const COLORS = {
  bg: '#edf3fb',
  card: '#ffffff',
  muted: '#627285',
  text: '#0e1a2f',
};

export function LibraryFoodsScreen(): React.JSX.Element {
  const vm = useFoodsViewModel();
  return <LibraryFoodsView {...vm} />;
}

function useFoodsViewModel() {
  const { t } = useTranslation();
  const state = useFoodState();
  const [expandedId, setExpandedId] = useState('');
  const form = useFoodCreateForm();
  const listQuery = useLibraryFoodsQuery({
    query: state.query,
    servingUnit: state.activeUnitFilter === 'all' ? undefined : state.activeUnitFilter,
    foodType: state.activeTypeFilter === 'all' ? undefined : state.activeTypeFilter,
    foodCategory: state.activeCategoryFilter === 'all' ? undefined : state.activeCategoryFilter,
  });
  return {
    ...state,
    expandedId,
    ...buildFoodChips(t),
    ...form,
    listQuery,
    ...buildFoodActions(state, form, t),
    onToggleDetail: (itemId: string) => setExpandedId((current) => (current === itemId ? '' : itemId)),
    t,
  };
}

function useFoodState() {
  const [createError, setCreateError] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [activeUnitFilter, setActiveUnitFilter] = useState<(typeof UNIT_FILTER_KEYS)[number]>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<(typeof TYPE_FILTER_KEYS)[number]>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<(typeof CATEGORY_FILTER_KEYS)[number]>('all');
  return {
    activeCategoryFilter,
    activeTypeFilter,
    activeUnitFilter,
    createError,
    createModalVisible,
    query,
    setActiveCategoryFilter,
    setActiveTypeFilter,
    setActiveUnitFilter,
    setCreateError,
    setCreateModalVisible,
    setQuery,
  };
}

function useFoodCreateForm() {
  const [form, setForm] = useState<FoodCreateFormState>(EMPTY_FOOD_FORM);
  const createMutation = useCreateFoodMutation();
  return {
    createMutation,
    form,
    resetForm: () => setForm(EMPTY_FOOD_FORM),
    setField: createFieldSetter(setForm),
    setServingUnit: (value: string) => setForm((current) => ({ ...current, servingUnit: value })),
  };
}

function buildFoodActions(
  state: ReturnType<typeof useFoodState>,
  form: ReturnType<typeof useFoodCreateForm>,
  t: (key: string) => string,
) {
  return {
    onCloseCreateModal: () => state.setCreateModalVisible(false),
    onCreate: () => createFood(form, state.setCreateError, state.setCreateModalVisible, t),
    onOpenCreateModal: () => state.setCreateModalVisible(true),
    onSelectCategoryFilter: (id: string) =>
      state.setActiveCategoryFilter(isCategoryFilter(id) ? id : 'all'),
    onSelectTypeFilter: (id: string) => state.setActiveTypeFilter(isTypeFilter(id) ? id : 'all'),
    onSelectUnitFilter: (id: string) => state.setActiveUnitFilter(isUnitFilter(id) ? id : 'all'),
  };
}

function createFood(
  formState: ReturnType<typeof useFoodCreateForm>,
  setCreateError: (value: string) => void,
  setCreateModalVisible: (value: boolean) => void,
  t: (key: string) => string,
): void {
  const error = resolveFoodFormError(formState.form, t);
  if (error) {
    setCreateError(error);
    return;
  }
  setCreateError('');
  formState.createMutation.mutate(
    {
      ...buildFoodPayload(formState.form),
      name: formState.form.name.trim(),
    },
    {
      onError: (requestError) => setCreateError(requestError.message),
      onSuccess: () => {
        formState.resetForm();
        setCreateModalVisible(false);
      },
    },
  );
}

type ViewModel = ReturnType<typeof useFoodsViewModel>;

function LibraryFoodsView(props: ViewModel): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{props.t('coach.library.foods.title')}</Text>
      <Text style={styles.subtitle}>{props.t('coach.library.foods.subtitle')}</Text>
      {renderSearchCard(props)}
      {renderCreateCta(props)}
      {renderCreateModal(props)}
      <View style={styles.card}>{renderList(props)}</View>
    </ScrollView>
  );
}

function renderCreateCta(props: ViewModel): React.JSX.Element {
  return (
    <LibraryCreateCta
      buttonLabel={props.t('coach.library.actions.create')}
      onPress={props.onOpenCreateModal}
      subtitle={props.t('coach.library.foods.cta.subtitle')}
      title={props.t('coach.library.foods.cta.title')}
    />
  );
}

function renderCreateModal(props: ViewModel): React.JSX.Element {
  return (
    <LibraryCreateModal
      cancelLabel={props.t('coach.clients.modal.cancel')}
      isSubmitting={props.createMutation.isPending}
      onClose={props.onCloseCreateModal}
      onSubmit={props.onCreate}
      submitLabel={props.t('coach.library.actions.create')}
      submittingLabel={props.t('coach.library.foods.modal.creating')}
      subtitle={props.t('coach.library.foods.modal.subtitle')}
      title={props.t('coach.library.foods.modal.title')}
      visible={props.createModalVisible}
    >
      <FilterChips
        activeId={props.form.servingUnit || 'all'}
        items={props.unitOptions}
        onSelect={(id) => props.setServingUnit(id === 'all' ? '' : id)}
      />
      <FoodCreateFields form={props.form} setField={props.setField} t={props.t} />
      {props.createError ? <Text style={styles.error}>{props.createError}</Text> : null}
    </LibraryCreateModal>
  );
}

function renderSearchCard(props: ViewModel): React.JSX.Element {
  return (
    <View style={styles.card}>
      <SearchBar
        onChangeText={props.setQuery}
        placeholder={props.t('coach.library.foods.searchPlaceholder')}
        value={props.query}
      />
      <FilterChips
        activeId={props.activeUnitFilter}
        items={props.unitFilters}
        onSelect={props.onSelectUnitFilter}
      />
      <FilterChips
        activeId={props.activeTypeFilter}
        items={props.typeFilters}
        onSelect={props.onSelectTypeFilter}
      />
      <FilterChips
        activeId={props.activeCategoryFilter}
        items={props.categoryFilters}
        onSelect={props.onSelectCategoryFilter}
      />
    </View>
  );
}

function renderList(props: ViewModel): React.JSX.Element {
  const items = props.listQuery.data ?? [];
  if (items.length === 0) {
    return <Text style={styles.empty}>{props.t('coach.library.empty')}</Text>;
  }
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <FoodLibraryRow
          expanded={props.expandedId === item.id}
          item={item}
          key={item.id}
          onToggle={() => props.onToggleDetail(item.id)}
          t={props.t}
        />
      ))}
    </View>
  );
}

function buildFoodChips(t: (key: string) => string) {
  return {
    unitFilters: mapFilterChips(UNIT_FILTER_KEYS, 'coach.library.foods.filters.unit', t),
    unitOptions: mapFilterChips(UNIT_FILTER_KEYS, 'coach.library.foods.filters.unit', t),
    typeFilters: mapFilterChips(TYPE_FILTER_KEYS, 'coach.library.foods.filters.type', t),
    categoryFilters: CATEGORY_FILTER_KEYS.map((id) => ({
      id,
      label: t(`coach.library.foods.filters.category.${id}`),
    })),
  };
}

function mapFilterChips(
  ids: readonly string[],
  keyPrefix: string,
  t: (key: string) => string,
) {
  return ids.map((id) => ({ id, label: t(`${keyPrefix}.${id}`) }));
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 12,
    padding: 14,
    width: '100%',
  },
  empty: {
    color: COLORS.muted,
    fontSize: 14,
  },
  error: {
    color: '#b42318',
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 12,
    minHeight: '100%',
    padding: 24,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    width: '100%',
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    width: '100%',
  },
});

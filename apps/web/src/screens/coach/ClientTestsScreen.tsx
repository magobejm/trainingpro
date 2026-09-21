import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';
import {
  useAssignPhysicalTestMutation,
  useClientPhysicalTestsQuery,
  usePhysicalTestsCatalogQuery,
  useRecordPhysicalTestResultMutation,
  useUnassignPhysicalTestMutation,
  type PhysicalTestResultView,
  type PhysicalTestView,
} from '../../data/hooks/usePhysicalTests';
import { useClientByIdQuery } from '../../data/hooks/useClientsQuery';
import { TestRouteModal } from './TestRouteModal';
import { TestTablesModal } from './TestTablesModal';

type Props = {
  clientId: string;
  clientName: string;
  onBack: () => void;
};

type ViewMode = 'catalog' | 'completed';

type ModalState = {
  route: PhysicalTestView | null;
  tables: PhysicalTestView | null;
};

export function ClientTestsScreen(props: Props): React.JSX.Element {
  const vm = useClientTestsViewModel(props);
  return <ClientTestsView {...vm} />;
}

function useClientTestsViewModel(props: Props) {
  const { t } = useTranslation();
  const clientQuery = useClientByIdQuery(props.clientId);
  const catalogQuery = usePhysicalTestsCatalogQuery();
  const assignmentsQuery = useClientPhysicalTestsQuery(props.clientId);
  const assignMutation = useAssignPhysicalTestMutation(props.clientId);
  const unassignMutation = useUnassignPhysicalTestMutation(props.clientId);
  const recordMutation = useRecordPhysicalTestResultMutation(props.clientId);
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modals, setModals] = useState<ModalState>({ route: null, tables: null });
  const [lastResult, setLastResult] = useState<PhysicalTestResultView | null>(null);

  const assignedIds = useMemo(
    () => new Set((assignmentsQuery.data ?? []).map((item) => item.physicalTestId)),
    [assignmentsQuery.data],
  );

  const categories = useMemo(() => {
    const values = new Set((catalogQuery.data ?? []).map((item) => item.category));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [catalogQuery.data]);

  const catalogItems = useMemo(() => {
    return filterTests(catalogQuery.data ?? [], search, category);
  }, [catalogQuery.data, category, search]);

  const completedItems = useMemo(() => {
    const completed = (assignmentsQuery.data ?? []).filter((item) => item.latestResult);
    return completed.map((item) => item.physicalTest).filter((test) => matchesFilters(test, search, category));
  }, [assignmentsQuery.data, category, search]);

  const client = clientQuery.data;
  const clientGender: 'F' | 'M' | null = client?.sex === 'female' ? 'F' : client?.sex === 'male' ? 'M' : null;
  const clientAge = resolveAge(client?.birthDate);

  return {
    assignMutation,
    assignedIds,
    catalogItems,
    categories,
    category,
    clientAge,
    clientGender,
    clientName: props.clientName,
    completedItems,
    expandedId,
    isLoading: catalogQuery.isLoading || assignmentsQuery.isLoading,
    lastResult,
    modals,
    onBack: props.onBack,
    recordMutation,
    search,
    setCategory,
    setExpandedId,
    setLastResult,
    setModals,
    setSearch,
    setViewMode,
    t,
    unassignMutation,
    viewMode,
  };
}

type ViewModel = ReturnType<typeof useClientTestsViewModel>;

function ClientTestsView(props: ViewModel): React.JSX.Element {
  const items = props.viewMode === 'catalog' ? props.catalogItems : props.completedItems;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{props.t('coach.tests.title')}</Text>
        <Text style={styles.subtitle}>{props.clientName}</Text>
      </View>

      <View style={styles.toggleRow}>
        <ToggleButton
          active={props.viewMode === 'catalog'}
          label={props.t('coach.tests.views.catalog')}
          onPress={() => props.setViewMode('catalog')}
        />
        <ToggleButton
          active={props.viewMode === 'completed'}
          label={props.t('coach.tests.views.completed')}
          onPress={() => props.setViewMode('completed')}
        />
      </View>

      <TextInput
        onChangeText={props.setSearch}
        placeholder={props.t('coach.tests.searchPlaceholder')}
        style={styles.searchInput}
        value={props.search}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <CategoryChip
          active={props.category === ''}
          label={props.t('coach.tests.allCategories')}
          onPress={() => props.setCategory('')}
        />
        {props.categories.map((item) => (
          <CategoryChip active={props.category === item} key={item} label={item} onPress={() => props.setCategory(item)} />
        ))}
      </ScrollView>

      {props.isLoading ? <Text style={styles.empty}>{props.t('coach.tests.loading')}</Text> : null}
      {!props.isLoading && items.length === 0 ? <Text style={styles.empty}>{props.t('coach.tests.empty')}</Text> : null}

      {items.map((test) => (
        <TestCard
          assigned={props.assignedIds.has(test.id)}
          expanded={props.expandedId === test.id}
          key={test.id}
          onAssign={() => void props.assignMutation.mutateAsync(test.id)}
          onUnassign={() => void props.unassignMutation.mutateAsync(test.id)}
          onOpenRoute={() => {
            props.setLastResult(null);
            props.setModals((prev) => ({ ...prev, route: test }));
          }}
          onOpenTables={() => props.setModals((prev) => ({ ...prev, tables: test }))}
          onToggle={() => props.setExpandedId(props.expandedId === test.id ? null : test.id)}
          t={props.t}
          test={test}
        />
      ))}

      <TestTablesModal
        onClose={() => props.setModals((prev) => ({ ...prev, tables: null }))}
        t={props.t}
        test={props.modals.tables}
        visible={Boolean(props.modals.tables)}
      />
      <TestRouteModal
        clientAge={props.clientAge}
        clientGender={props.clientGender}
        isSubmitting={props.recordMutation.isPending}
        onClose={() => {
          props.setModals((prev) => ({ ...prev, route: null }));
          props.setLastResult(null);
        }}
        onSubmit={(inputs) => {
          if (!props.modals.route) return;
          void recordResultEnsuringAssignment(props, props.modals.route.id, inputs);
        }}
        result={props.lastResult}
        t={props.t}
        test={props.modals.route}
        visible={Boolean(props.modals.route)}
      />
    </ScrollView>
  );
}

function TestCard(props: {
  assigned: boolean;
  expanded: boolean;
  onAssign: () => void;
  onOpenRoute: () => void;
  onOpenTables: () => void;
  onToggle: () => void;
  onUnassign: () => void;
  t: ViewModel['t'];
  test: PhysicalTestView;
}): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Pressable onPress={props.onToggle} style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{props.test.name}</Text>
          <Text style={styles.cardMeta}>{`${props.test.category} · ${props.test.level}`}</Text>
        </View>
        <Text style={styles.chevron}>{props.expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {props.expanded ? (
        <View style={styles.cardBody}>
          <Text style={styles.sectionLabel}>{props.t('coach.tests.objective')}</Text>
          <Text style={styles.sectionText}>{props.test.objective}</Text>
          <Text style={styles.sectionLabel}>{props.t('coach.tests.instructions')}</Text>
          <Text style={styles.sectionText}>{props.test.whatToDo}</Text>
          <Text style={styles.sectionLabel}>{props.t('coach.tests.measure')}</Text>
          <Text style={styles.sectionText}>{props.test.whatToMeasure}</Text>
          {props.test.options ? (
            <>
              <Text style={styles.sectionLabel}>{props.t('coach.tests.options')}</Text>
              <Text style={styles.sectionText}>{`${props.t('coach.tests.economic')}: ${props.test.options.economic}`}</Text>
              <Text style={styles.sectionText}>{`${props.t('coach.tests.pro')}: ${props.test.options.pro}`}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <ActionButton label={props.t('coach.tests.actions.tables')} onPress={props.onOpenTables} />
        <ActionButton label={props.t('coach.tests.actions.route')} onPress={props.onOpenRoute} />
        <ActionButton
          label={props.assigned ? props.t('coach.tests.actions.unassign') : props.t('coach.tests.actions.assign')}
          onPress={props.assigned ? props.onUnassign : props.onAssign}
          primary={!props.assigned}
        />
      </View>
    </View>
  );
}

function ToggleButton(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.toggleButton, props.active && styles.toggleButtonActive]}>
      <Text style={[styles.toggleLabel, props.active && styles.toggleLabelActive]}>{props.label}</Text>
    </Pressable>
  );
}

function CategoryChip(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.chip, props.active && styles.chipActive]}>
      <Text style={[styles.chipLabel, props.active && styles.chipLabelActive]}>{props.label}</Text>
    </Pressable>
  );
}

function ActionButton(props: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  primary?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      disabled={props.disabled}
      onPress={props.onPress}
      style={[
        styles.actionButton,
        props.primary && styles.actionButtonPrimary,
        props.disabled && styles.actionButtonDisabled,
      ]}
    >
      <Text
        style={[
          styles.actionLabel,
          props.primary && styles.actionLabelPrimary,
          props.disabled && styles.actionLabelDisabled,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function filterTests(items: PhysicalTestView[], search: string, category: string): PhysicalTestView[] {
  return items.filter((item) => matchesFilters(item, search, category));
}

function matchesFilters(item: PhysicalTestView, search: string, category: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();
  const matchesSearch =
    normalizedSearch.length === 0 ||
    item.name.toLowerCase().includes(normalizedSearch) ||
    item.category.toLowerCase().includes(normalizedSearch);
  const matchesCategory = category.length === 0 || item.category === category;
  return matchesSearch && matchesCategory;
}

async function recordResultEnsuringAssignment(
  props: ViewModel,
  testId: string,
  inputs: Parameters<ViewModel['recordMutation']['mutateAsync']>[0]['inputs'],
): Promise<void> {
  if (!props.assignedIds.has(testId)) {
    try {
      await props.assignMutation.mutateAsync(testId);
    } catch {
      // Already assigned or race; recording still requires a persisted assignment.
    }
  }
  const result = await props.recordMutation.mutateAsync({ inputs, testId });
  props.setLastResult(result);
}

function resolveAge(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDiff = now.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

const styles = StyleSheet.create({
  page: {
    gap: 14,
    paddingBottom: 24,
  },
  header: {
    gap: 4,
  },
  title: {
    color: '#0e1a2f',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#627285',
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4f0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#edf3fb',
    borderColor: '#225fdb',
  },
  toggleLabel: {
    color: '#627285',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: '#225fdb',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4f0',
    borderRadius: 10,
    borderWidth: 1,
    color: '#0e1a2f',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  chip: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4f0',
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#225fdb',
    borderColor: '#225fdb',
  },
  chipLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#ffffff',
  },
  empty: {
    color: '#627285',
    fontSize: 14,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4f0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitleBlock: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  cardTitle: {
    color: '#0e1a2f',
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: {
    color: '#627285',
    fontSize: 12,
  },
  chevron: {
    color: '#627285',
    fontSize: 16,
  },
  cardBody: {
    gap: 6,
  },
  sectionLabel: {
    color: '#0e1a2f',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4f0',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonPrimary: {
    backgroundColor: '#225fdb',
    borderColor: '#225fdb',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  actionLabelPrimary: {
    color: '#ffffff',
  },
  actionLabelDisabled: {
    color: '#94a3b8',
  },
});

import { EmptyIllustration } from '../../components/EmptyIllustrations';
import { LoadingState } from '../../components/AsyncStatus';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { buildCompletedRows, CompletedTestList } from './ClientTestsCompleted';
import { ScheduleTestModal } from './ClientTestsScheduleModal';
import { TestRouteModal } from './TestRouteModal';
import { TestTablesModal } from './TestTablesModal';
import { Button, EmptyState, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';

const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SM = 'sm' as const;

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
  const [scheduling, setScheduling] = useState<PhysicalTestView | null>(null);
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

  const client = clientQuery.data;
  const clientGender: 'F' | 'M' | null = client?.sex === 'female' ? 'F' : client?.sex === 'male' ? 'M' : null;
  const clientAge = resolveAge(client?.birthDate);

  return {
    assignMutation,
    assignedIds,
    assignments: assignmentsQuery.data ?? [],
    catalogItems,
    categories,
    category,
    clientAge,
    clientGender,
    clientId: props.clientId,
    clientName: props.clientName,
    expandedId,
    isLoading: catalogQuery.isLoading || assignmentsQuery.isLoading,
    lastResult,
    modals,
    onBack: props.onBack,
    recordMutation,
    scheduling,
    search,
    setCategory,
    setScheduling,
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
  const items = props.catalogItems;
  const completedRows = buildCompletedRows(props.assignments, props.search, props.category);
  const datesByTest = new Map(
    props.assignments.map((item) => [item.physicalTestId, item.schedules.map((schedule) => schedule.scheduledDate)]),
  );
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

      <TextField
        accessibilityLabel={props.t('coach.tests.searchPlaceholder')}
        onChangeText={props.setSearch}
        placeholder={props.t('coach.tests.searchPlaceholder')}
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

      {props.isLoading ? <LoadingState label={props.t('coach.tests.loading')} variant="cards" /> : null}
      {!props.isLoading && props.viewMode === 'catalog' && items.length === 0 ? (
        <EmptyState icon={<EmptyIllustration kind={'generic'} />} title={props.t('coach.tests.empty')} />
      ) : null}

      {props.viewMode === 'completed' ? <CompletedTestList rows={completedRows} t={props.t} /> : null}
      {props.viewMode === 'catalog'
        ? items.map((test) => (
            <TestCard
              assigned={props.assignedIds.has(test.id)}
              expanded={props.expandedId === test.id}
              key={test.id}
              onAssign={() => props.setScheduling(test)}
              scheduledDates={datesByTest.get(test.id) ?? []}
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
          ))
        : null}

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
      <ScheduleTestModal
        clientId={props.clientId}
        onClose={() => props.setScheduling(null)}
        t={props.t}
        test={props.scheduling}
      />
    </ScrollView>
  );
}

function formatScheduledDates(dates: string[]): string {
  return [...dates]
    .map((value) => value.slice(0, 10))
    .sort()
    .map((value) => {
      const [year, month, day] = value.split('-');
      return year && month && day ? `${day}/${month}/${year}` : value;
    })
    .join(', ');
}

function TestCard(props: {
  assigned: boolean;
  expanded: boolean;
  onAssign: () => void;
  onOpenRoute: () => void;
  onOpenTables: () => void;
  onToggle: () => void;
  onUnassign: () => void;
  scheduledDates: string[];
  t: ViewModel['t'];
  test: PhysicalTestView;
}): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Pressable onPress={props.onToggle} style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{props.test.name}</Text>
          <Text style={styles.cardMeta}>{`${props.test.category} · ${props.test.level}`}</Text>
          {props.scheduledDates.length > 0 ? (
            <Text style={styles.cardMeta}>
              {props.t('coach.tests.schedule.dates', { dates: formatScheduledDates(props.scheduledDates) })}
            </Text>
          ) : null}
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
        <Button
          label={props.t('coach.tests.actions.tables')}
          onPress={props.onOpenTables}
          size={SIZE_SM}
          variant={VARIANT_SECONDARY}
        />
        <Button
          label={props.t('coach.tests.actions.route')}
          onPress={props.onOpenRoute}
          size={SIZE_SM}
          variant={VARIANT_SECONDARY}
        />
        <Button
          label={props.assigned ? props.t('coach.tests.actions.unassign') : props.t('coach.tests.actions.assign')}
          onPress={props.assigned ? props.onUnassign : props.onAssign}
          size={SIZE_SM}
          variant={props.assigned ? VARIANT_SECONDARY : undefined}
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
    gap: space.lg,
    paddingBottom: space.xl,
  },
  header: {
    gap: space.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  toggleButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  toggleButtonActive: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  toggleLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: colors.primary,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.onPrimary,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingVertical: space.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.md,
    padding: space.lg,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitleBlock: {
    flex: 1,
    gap: 2,
    paddingRight: space.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  cardBody: {
    gap: space.sm,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  sectionText: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
});

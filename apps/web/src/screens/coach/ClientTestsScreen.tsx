import { EmptyIllustration } from '../../components/EmptyIllustrations';
import { LoadingState } from '../../components/AsyncStatus';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
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
import { EmptyState, TextField } from '@trainerpro/ui';
import {
  CategoryChip,
  filterTests,
  recordResultEnsuringAssignment,
  resolveAge,
  styles,
  TestCard,
  ToggleButton,
} from './ClientTestsScreen.parts';

type Props = {
  clientId: string;
  clientName: string;
  onBack: () => void;
};

type ViewMode = 'catalog' | 'completed';

export type ClientTestsViewModel = ReturnType<typeof useClientTestsViewModel>;

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

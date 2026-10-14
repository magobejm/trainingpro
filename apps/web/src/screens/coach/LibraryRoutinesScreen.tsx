import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button, EmptyState, useBreakpoint } from '@trainerpro/ui';
import { C, ss } from './LibraryRoutinesScreen.styles';
import { Search, Plus } from 'lucide-react';
import { type RoutineTemplateView } from '../../data/hooks/useRoutineTemplates';
import { type WarmupTemplateView } from '../../data/hooks/useWarmupTemplates';

import { QueryResult } from '../../components/AsyncStatus';
import { EmptyIllustration } from '../../components/EmptyIllustrations';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { SaveRoutineModal } from './components/RoutinePlanner/SaveRoutineModal';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { useViewModel, type RoutineLibraryTab } from './LibraryRoutinesScreen.model';
import { pickRoutineImage, pickWarmupImage, RoutineCard, WarmupCard } from './LibraryRoutinesScreen.cards';

type Tab = RoutineLibraryTab;
type Props = { defaultTab?: Tab; onRouteChange: (route: ShellRoute) => void };
type T = (k: string, opts?: Record<string, unknown>) => string;
type MediaMap = Record<string, string | null>;

export function LibraryRoutinesScreen({ defaultTab = 'routines', onRouteChange }: Props): React.JSX.Element {
  const vm = useViewModel(defaultTab, onRouteChange);
  return <ScreenView vm={vm} />;
}

type VM = ReturnType<typeof useViewModel>;

/* ── Screen view ── */

function ScreenView({ vm }: { vm: VM }): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={ss.container} onScroll={vm.onListScroll} scrollEventThrottle={200}>
      <ScreenHeader vm={vm} />
      <TabBar tab={vm.tab} setTab={vm.setTab} t={vm.t} />
      {vm.tab === 'routines' ? (
        <RoutineGrid
          clientId={vm.clientId}
          hasActiveFilter={vm.query.trim().length > 0}
          onClearFilters={() => vm.setQuery('')}
          items={vm.filteredRoutines}
          mediaMap={vm.mediaMap}
          onAssign={vm.onAssignRoutine}
          onCreate={vm.onCreateRoutine}
          onDelete={vm.onDeleteRoutine}
          onEdit={vm.onEditRoutine}
          onRetry={() => void vm.routinesQuery.refetch()}
          onView={vm.onViewRoutine}
          queryError={vm.routinesQuery.error}
          queryFailed={vm.routinesQuery.isError}
          queryLoading={vm.routinesQuery.isLoading}
          t={vm.t}
        />
      ) : (
        <WarmupGrid
          hasActiveFilter={vm.query.trim().length > 0}
          onClearFilters={() => vm.setQuery('')}
          items={vm.filteredWarmups}
          mediaMap={vm.mediaMap}
          onCreate={vm.onCreateWarmup}
          onDelete={vm.onDeleteWarmup}
          onEdit={vm.onEditWarmup}
          onRetry={() => void vm.warmupsQuery.refetch()}
          onView={vm.onViewWarmup}
          queryError={vm.warmupsQuery.error}
          queryFailed={vm.warmupsQuery.isError}
          queryLoading={vm.warmupsQuery.isLoading}
          t={vm.t}
        />
      )}
      <ActionConfirmModal
        cancelLabel={vm.t('coach.routine.delete.cancel')}
        confirmLabel={vm.t('coach.routine.delete.action')}
        errorMessage={vm.deleteError}
        message={vm.t('coach.routine.delete.confirm')}
        onCancel={() => {
          vm.setDeleteError(null);
          vm.setPendingDeleteId('');
        }}
        onConfirm={vm.onConfirmDelete}
        title={vm.t('coach.routine.delete.title')}
        visible={Boolean(vm.pendingDeleteId)}
      />
      <SaveRoutineModal
        initialName={vm.assignTemplate?.name ?? ''}
        isGlobal
        onAssignOnly={vm.onConfirmAssign}
        onClose={vm.onCloseAssign}
        onSave={async () => undefined}
        onSaveAndAssign={async () => undefined}
        t={vm.t}
        templateId={vm.assignTemplate?.id}
        visible={Boolean(vm.assignTemplate)}
      />
    </ScrollView>
  );
}

function ScreenHeader({ vm }: { vm: VM }): React.JSX.Element {
  const compact = useBreakpoint() !== 'lg';
  return (
    <View style={[ss.header, compact && ss.headerCompact]}>
      <Text style={ss.title}>{vm.t('coach.routineLib.title')}</Text>
      <View style={[ss.headerRight, compact && ss.headerRightCompact]}>
        <View style={[ss.searchContainer, compact && ss.searchContainerFluid]}>
          <Search color={C.muted} size={16} />
          <TextInput
            onChangeText={vm.setQuery}
            placeholder={vm.t('coach.routineLib.searchPlaceholder')}
            style={ss.searchInput}
            value={vm.query}
          />
        </View>
        {vm.tab === 'routines' ? (
          <Button
            icon={<Plus color={C.white} size={14} />}
            label={vm.t('coach.routineLib.createRoutine')}
            onPress={vm.onCreateRoutine}
          />
        ) : (
          <Button
            icon={<Plus color={C.white} size={14} />}
            label={vm.t('coach.routineLib.createWarmup')}
            onPress={vm.onCreateWarmup}
          />
        )}
      </View>
    </View>
  );
}

/* ── Tabs ── */

function TabBar({ tab, setTab, t }: { tab: Tab; setTab: (v: Tab) => void; t: T }) {
  return (
    <View style={ss.tabRow}>
      <Pressable onPress={() => setTab('routines')} style={[ss.tab, tab === 'routines' && ss.tabActive]}>
        <Text style={[ss.tabText, tab === 'routines' && ss.tabTextActive]}>{t('coach.routineLib.tabRoutines')}</Text>
      </Pressable>
      <Pressable onPress={() => setTab('warmups')} style={[ss.tab, tab === 'warmups' && ss.tabActive]}>
        <Text style={[ss.tabText, tab === 'warmups' && ss.tabTextActive]}>{t('coach.routineLib.tabWarmups')}</Text>
      </Pressable>
    </View>
  );
}

/* ── Grids ── */

function RoutineGrid(props: {
  clientId: string | null;
  hasActiveFilter: boolean;
  onClearFilters: () => void;
  items: RoutineTemplateView[];
  mediaMap: MediaMap;
  onAssign: (tpl: RoutineTemplateView) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onEdit: (tpl: RoutineTemplateView) => void;
  onRetry: () => void;
  onView: (tpl: RoutineTemplateView) => void;
  queryError: unknown;
  queryFailed: boolean;
  queryLoading: boolean;
  t: T;
}) {
  if (!props.queryLoading && !props.queryFailed && !props.hasActiveFilter && props.items.length === 0) {
    return (
      <EmptyState
        actionLabel={props.t('coach.routineLib.createRoutine')}
        icon={<EmptyIllustration kind={'library'} />}
        message={props.t('coach.routineLib.emptyInvite')}
        onAction={props.onCreate}
        title={props.t('coach.routineLib.emptyRoutines')}
      />
    );
  }
  const status = QueryResult({
    emptyIllustration: 'library',
    emptyTitle: props.t('coach.routineLib.emptyRoutines'),
    skeleton: 'cards',
    error: props.queryError,
    hasActiveFilter: props.hasActiveFilter,
    isError: props.queryFailed,
    isLoading: props.queryLoading,
    itemCount: props.items.length,
    onRetry: props.onRetry,
    onClearFilters: props.onClearFilters,
  });
  if (status) {
    return status;
  }
  return (
    <View {...{ dataSet: { 'density-list': 'true' } }} style={ss.grid}>
      {props.items.map((tpl) => (
        <RoutineCard
          clientId={props.clientId}
          key={tpl.id}
          tpl={tpl}
          mediaUrl={pickRoutineImage(tpl, props.mediaMap)}
          onAssign={props.onAssign}
          onView={props.onView}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          t={props.t}
        />
      ))}
    </View>
  );
}

function WarmupGrid(props: {
  hasActiveFilter: boolean;
  onClearFilters: () => void;
  items: WarmupTemplateView[];
  mediaMap: MediaMap;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onEdit: (tpl: WarmupTemplateView) => void;
  onRetry: () => void;
  onView: (tpl: WarmupTemplateView) => void;
  queryError: unknown;
  queryFailed: boolean;
  queryLoading: boolean;
  t: T;
}) {
  if (!props.queryLoading && !props.queryFailed && !props.hasActiveFilter && props.items.length === 0) {
    return (
      <EmptyState
        actionLabel={props.t('coach.routineLib.createWarmup')}
        icon={<EmptyIllustration kind={'library'} />}
        message={props.t('coach.routineLib.emptyWarmupsHint')}
        onAction={props.onCreate}
        title={props.t('coach.routineLib.emptyWarmups')}
      />
    );
  }
  const status = QueryResult({
    emptyIllustration: 'library',
    emptyTitle: props.t('coach.routineLib.emptyWarmups'),
    skeleton: 'cards',
    error: props.queryError,
    hasActiveFilter: props.hasActiveFilter,
    isError: props.queryFailed,
    isLoading: props.queryLoading,
    itemCount: props.items.length,
    onRetry: props.onRetry,
    onClearFilters: props.onClearFilters,
  });
  if (status) {
    return status;
  }
  return (
    <View {...{ dataSet: { 'density-list': 'true' } }} style={ss.grid}>
      {props.items.map((tpl) => (
        <WarmupCard
          key={tpl.id}
          tpl={tpl}
          mediaUrl={pickWarmupImage(tpl, props.mediaMap)}
          onView={props.onView}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          t={props.t}
        />
      ))}
    </View>
  );
}

/* ── Cards ── */

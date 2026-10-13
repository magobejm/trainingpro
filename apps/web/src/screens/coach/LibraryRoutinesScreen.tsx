import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View, type ViewStyle } from 'react-native';
import { Button, EmptyState, IconButton, useBreakpoint, useReducedMotion } from '@trainerpro/ui';
import { C, ss } from './LibraryRoutinesScreen.styles';
import { Trophy, Activity, Pencil, Trash2, Search, Plus, UserPlus } from 'lucide-react';
import { type RoutineTemplateView } from '../../data/hooks/useRoutineTemplates';
import { type WarmupTemplateView } from '../../data/hooks/useWarmupTemplates';
import { readFrontEnv } from '../../data/env';
import { QueryResult } from '../../components/AsyncStatus';
import { EmptyIllustration } from '../../components/EmptyIllustrations';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { SaveRoutineModal } from './components/RoutinePlanner/SaveRoutineModal';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { useViewModel, type RoutineLibraryTab } from './LibraryRoutinesScreen.model';

type Tab = RoutineLibraryTab;
type Props = { defaultTab?: Tab; onRouteChange: (route: ShellRoute) => void };
type T = (k: string, opts?: Record<string, unknown>) => string;
type MediaMap = Record<string, string | null>;

function apiBase(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const ROUTINE_PLACEHOLDER = () => `${apiBase()}/assets/placeholders/routine-placeholder.jpg`;
const WARMUP_PLACEHOLDER = () => `${apiBase()}/assets/placeholders/warmup-placeholder.png`;

export function LibraryRoutinesScreen({ defaultTab = 'routines', onRouteChange }: Props): React.JSX.Element {
  const vm = useViewModel(defaultTab, onRouteChange);
  return <ScreenView vm={vm} />;
}

type VM = ReturnType<typeof useViewModel>;

/* ── Screen view ── */

function ScreenView({ vm }: { vm: VM }): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={ss.container}>
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

function RoutineCard(props: {
  clientId: string | null;
  tpl: RoutineTemplateView;
  mediaUrl: string;
  onAssign: (tpl: RoutineTemplateView) => void;
  onView: (tpl: RoutineTemplateView) => void;
  onEdit: (tpl: RoutineTemplateView) => void;
  onDelete: (id: string) => void;
  t: T;
}) {
  const { tpl, t } = props;
  const bp = useBreakpoint();
  const reduced = useReducedMotion();
  const canEdit = tpl.scope !== 'GLOBAL';
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      {...{ dataSet: { 'interactive-card': reduced ? 'reduced' : 'true' } }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => props.onView(tpl)}
      style={[ss.card, bp === 'md' && ss.cardMd, bp === 'sm' && ss.cardSm]}
    >
      <CardTopBar
        canEdit={canEdit}
        icon={<Trophy color={C.blue} size={18} />}
        onAssign={canEdit ? () => props.onAssign(tpl) : undefined}
        onEdit={() => props.onEdit(tpl)}
        onDelete={() => props.onDelete(tpl.id)}
        t={t}
      />
      <CardImage hovered={hovered && !reduced} mediaUrl={props.mediaUrl} />
      <View {...{ dataSet: { 'density-row': 'true' } }} style={ss.cardBody}>
        <Text style={ss.cardName}>{tpl.name}</Text>
        <View style={ss.cardMeta}>
          <Text style={ss.cardMetaBlue}>{t('coach.routine.list.days', { count: tpl.days.length })}</Text>
          {tpl.expectedCompletionDays ? (
            <Text style={ss.cardMetaGray}>{t('coach.routineLib.microcycle', { count: tpl.expectedCompletionDays })}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function WarmupCard(props: {
  tpl: WarmupTemplateView;
  mediaUrl: string;
  onView: (tpl: WarmupTemplateView) => void;
  onEdit: (tpl: WarmupTemplateView) => void;
  onDelete: (id: string) => void;
  t: T;
}) {
  const { tpl, t } = props;
  const bp = useBreakpoint();
  const reduced = useReducedMotion();
  const canEdit = tpl.scope !== 'GLOBAL';
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      {...{ dataSet: { 'interactive-card': reduced ? 'reduced' : 'true' } }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => props.onView(tpl)}
      style={[ss.card, bp === 'md' && ss.cardMd, bp === 'sm' && ss.cardSm]}
    >
      <CardTopBar
        canEdit={canEdit}
        icon={<Activity color={C.blue} size={18} />}
        onEdit={() => props.onEdit(tpl)}
        onDelete={() => props.onDelete(tpl.id)}
        t={t}
      />
      <CardImage hovered={hovered && !reduced} mediaUrl={props.mediaUrl} />
      <View {...{ dataSet: { 'density-row': 'true' } }} style={ss.cardBody}>
        <Text style={ss.cardName}>{tpl.name}</Text>
        <Text style={ss.cardMetaGray}>{t('coach.warmupPlanner.blocksCount', { count: tpl.items.length })}</Text>
      </View>
    </Pressable>
  );
}

function CardTopBar(props: {
  canEdit: boolean;
  icon: React.ReactNode;
  onAssign?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: T;
}) {
  return (
    <View style={ss.cardTop}>
      <View style={ss.dot} />
      {props.icon}
      <View style={{ flex: 1 }} />
      {props.onAssign && (
        <IconButton
          accessibilityLabel={props.t('common.assign')}
          icon={() => <UserPlus color={C.blue} size={16} />}
          onPress={props.onAssign}
          size={28}
        />
      )}
      {props.canEdit ? (
        <>
          <IconButton
            accessibilityLabel={props.t('coach.library.exercises.actions.edit')}
            icon={(color) => <Pencil color={color} size={14} />}
            onPress={props.onEdit}
            size={28}
          />
          <IconButton
            accessibilityLabel={props.t('coach.library.exercises.actions.delete')}
            icon={(color) => <Trash2 color={color} size={14} />}
            onPress={props.onDelete}
            size={28}
            tone="danger"
          />
        </>
      ) : null}
    </View>
  );
}

function CardImage({ mediaUrl, hovered }: { mediaUrl: string; hovered: boolean }) {
  return (
    <View style={ss.cardImg}>
      <Image blurRadius={16} resizeMode={'cover'} source={{ uri: mediaUrl }} style={ss.imgBackdrop} />
      <View style={ss.imgShade} />
      <Image
        resizeMode={'contain'}
        source={{ uri: mediaUrl }}
        style={[ss.imgInner, hovered && (ss.imgInnerHovered as ViewStyle)]}
      />
    </View>
  );
}

/* ── Pure helpers ── */

function pickRoutineImage(tpl: RoutineTemplateView, map: MediaMap): string {
  for (const day of tpl.days) {
    for (const ex of day.exercises ?? []) {
      if (ex.exerciseLibraryId && map[ex.exerciseLibraryId]) {
        return map[ex.exerciseLibraryId] as string;
      }
    }
  }
  return ROUTINE_PLACEHOLDER();
}

function pickWarmupImage(tpl: WarmupTemplateView, map: MediaMap): string {
  for (const item of tpl.items) {
    const id =
      item.exerciseLibraryId ?? item.mobilityExerciseLibraryId ?? item.plioExerciseLibraryId ?? item.cardioMethodLibraryId;
    if (id && map[id]) return map[id] as string;
  }
  return WARMUP_PLACEHOLDER();
}

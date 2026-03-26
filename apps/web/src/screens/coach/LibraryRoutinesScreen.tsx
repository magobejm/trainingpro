import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, Text, TextInput, View, type ViewStyle } from 'react-native';
import { C, ss } from './LibraryRoutinesScreen.styles';
import { Trophy, Activity, Pencil, Trash2, Search, Plus, UserPlus } from 'lucide-react';
import { useAssignRoutineMutation } from '../../data/hooks/useClientMutations';
import {
  useRoutineTemplatesQuery,
  useDeleteRoutineTemplateMutation,
  type RoutineTemplateView,
} from '../../data/hooks/useRoutineTemplates';
import {
  useWarmupTemplatesQuery,
  useDeleteWarmupTemplateMutation,
  type WarmupTemplateView,
} from '../../data/hooks/useWarmupTemplates';
import { useUnifiedExercisesQuery } from '../../data/hooks/useUnifiedLibraryQuery';
import { readFrontEnv } from '../../data/env';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import { useWarmupPlannerContextStore } from '../../store/warmupPlannerContext.store';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';

type Tab = 'routines' | 'warmups';
type Props = { onRouteChange: (route: ShellRoute) => void };
type T = (k: string, opts?: Record<string, unknown>) => string;
type MediaMap = Record<string, string | null>;

function apiBase(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const ROUTINE_PLACEHOLDER = () => `${apiBase()}/assets/placeholders/routine-placeholder.jpg`;
const WARMUP_PLACEHOLDER = () => `${apiBase()}/assets/placeholders/warmup-placeholder.png`;

export function LibraryRoutinesScreen({ onRouteChange }: Props): React.JSX.Element {
  const vm = useViewModel(onRouteChange);
  return <ScreenView vm={vm} />;
}

/* ── View model ── */

function useViewModel(onRouteChange: (route: ShellRoute) => void) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('routines');
  const [query, setQuery] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState('');
  const [deleteKind, setDeleteKind] = useState<Tab>('routines');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const routines = useRoutineTemplatesQuery().data ?? [];
  const warmups = useWarmupTemplatesQuery().data ?? [];
  const exercises = useUnifiedExercisesQuery({}).data ?? [];
  const mediaMap = useMemo<MediaMap>(() => Object.fromEntries(exercises.map((e) => [e.id, e.mediaUrl])), [exercises]);
  const clientId = useRoutinePlannerContextStore((s) => s.clientId);
  const openForEdit = useRoutinePlannerContextStore((s) => s.openForEdit);
  const openForView = useRoutinePlannerContextStore((s) => s.openForView);
  const clearRoutine = useRoutinePlannerContextStore((s) => s.clear);
  const setWarmupInitial = useWarmupPlannerContextStore((s) => s.setInitialTemplate);
  const clearWarmup = useWarmupPlannerContextStore((s) => s.clear);
  const assignRoutine = useAssignRoutineMutation();
  const deleteRoutine = useDeleteRoutineTemplateMutation();
  const deleteWarmup = useDeleteWarmupTemplateMutation();
  const filteredRoutines = useFiltered(routines, query);
  const filteredWarmups = useFiltered(warmups, query);
  const pendingName = useMemo(() => {
    const all = [...routines, ...warmups] as Array<{ id: string; name: string }>;
    return all.find((r) => r.id === pendingDeleteId)?.name ?? '';
  }, [pendingDeleteId, routines, warmups]);
  const onConfirmDelete = buildConfirmDelete(
    pendingDeleteId,
    deleteKind,
    deleteRoutine,
    deleteWarmup,
    setPendingDeleteId,
    pendingName,
    setDeleteError,
  );
  return {
    clientId,
    filteredRoutines,
    filteredWarmups,
    mediaMap,
    onConfirmDelete,
    deleteError,
    setDeleteError,
    onCreateRoutine: () => {
      clearRoutine();
      onRouteChange('coach.routine.planner');
    },
    onCreateWarmup: () => {
      clearWarmup();
      onRouteChange('coach.warmup.planner');
    },
    onAssignRoutine: (tpl: RoutineTemplateView) => {
      if (!clientId) return;
      void assignRoutine.mutateAsync({ clientId, templateId: tpl.id }).then(() => {
        clearRoutine();
        onRouteChange('coach.clients');
      });
    },
    onViewRoutine: (tpl: RoutineTemplateView) => {
      openForView(tpl.id);
      onRouteChange('coach.routine.planner');
    },
    onEditRoutine: (tpl: RoutineTemplateView) => {
      openForEdit(tpl.id);
      onRouteChange('coach.routine.planner');
    },
    onEditWarmup: (tpl: WarmupTemplateView) => {
      setWarmupInitial(tpl.id);
      onRouteChange('coach.warmup.planner');
    },
    onDeleteRoutine: (id: string) => {
      setDeleteError(null);
      setDeleteKind('routines');
      setPendingDeleteId(id);
    },
    onDeleteWarmup: (id: string) => {
      setDeleteError(null);
      setDeleteKind('warmups');
      setPendingDeleteId(id);
    },
    pendingDeleteId,
    pendingName,
    query,
    setQuery,
    setPendingDeleteId,
    t,
    tab,
    setTab,
  };
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
          items={vm.filteredRoutines}
          mediaMap={vm.mediaMap}
          onAssign={vm.onAssignRoutine}
          onView={vm.onViewRoutine}
          onEdit={vm.onEditRoutine}
          onDelete={vm.onDeleteRoutine}
          t={vm.t}
        />
      ) : (
        <WarmupGrid
          items={vm.filteredWarmups}
          mediaMap={vm.mediaMap}
          onEdit={vm.onEditWarmup}
          onDelete={vm.onDeleteWarmup}
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
    </ScrollView>
  );
}

function ScreenHeader({ vm }: { vm: VM }): React.JSX.Element {
  return (
    <View style={ss.header}>
      <Text style={ss.title}>{vm.t('coach.routineLib.title')}</Text>
      <View style={ss.headerRight}>
        <View style={ss.searchContainer}>
          <Search color={C.muted} size={16} />
          <TextInput
            onChangeText={vm.setQuery}
            placeholder={vm.t('coach.routineLib.searchPlaceholder')}
            style={ss.searchInput}
            value={vm.query}
          />
        </View>
        {vm.tab === 'routines' ? (
          <Pressable onPress={vm.onCreateRoutine} style={ss.createBtn}>
            <Plus color={C.white} size={14} />
            <Text style={ss.createBtnText}>{vm.t('coach.routineLib.createRoutine')}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={vm.onCreateWarmup} style={ss.createBtn}>
            <Plus color={C.white} size={14} />
            <Text style={ss.createBtnText}>{vm.t('coach.routineLib.createWarmup')}</Text>
          </Pressable>
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
  items: RoutineTemplateView[];
  mediaMap: MediaMap;
  onAssign: (tpl: RoutineTemplateView) => void;
  onView: (tpl: RoutineTemplateView) => void;
  onEdit: (tpl: RoutineTemplateView) => void;
  onDelete: (id: string) => void;
  t: T;
}) {
  if (props.items.length === 0) {
    return <Text style={ss.empty}>{props.t('coach.routineLib.emptyRoutines')}</Text>;
  }
  return (
    <View style={ss.grid}>
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
  items: WarmupTemplateView[];
  mediaMap: MediaMap;
  onEdit: (tpl: WarmupTemplateView) => void;
  onDelete: (id: string) => void;
  t: T;
}) {
  if (props.items.length === 0) {
    return <Text style={ss.empty}>{props.t('coach.routineLib.emptyWarmups')}</Text>;
  }
  return (
    <View style={ss.grid}>
      {props.items.map((tpl) => (
        <WarmupCard
          key={tpl.id}
          tpl={tpl}
          mediaUrl={pickWarmupImage(tpl, props.mediaMap)}
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
  const canEdit = tpl.scope !== 'GLOBAL';
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => props.onView(tpl)}
      style={ss.card}
    >
      <CardTopBar
        canEdit={canEdit}
        icon={<Trophy color={C.blue} size={18} />}
        onAssign={props.clientId ? () => props.onAssign(tpl) : undefined}
        onEdit={() => props.onEdit(tpl)}
        onDelete={() => props.onDelete(tpl.id)}
      />
      <CardImage hovered={hovered} mediaUrl={props.mediaUrl} />
      <View style={ss.cardBody}>
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
  onEdit: (tpl: WarmupTemplateView) => void;
  onDelete: (id: string) => void;
  t: T;
}) {
  const { tpl, t } = props;
  const canEdit = tpl.scope !== 'GLOBAL';
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={ss.card}>
      <CardTopBar
        canEdit={canEdit}
        icon={<Activity color={C.blue} size={18} />}
        onEdit={() => props.onEdit(tpl)}
        onDelete={() => props.onDelete(tpl.id)}
      />
      <CardImage hovered={hovered} mediaUrl={props.mediaUrl} />
      <View style={ss.cardBody}>
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
}) {
  return (
    <View style={ss.cardTop}>
      <View style={ss.dot} />
      {props.icon}
      <View style={{ flex: 1 }} />
      {props.onAssign && (
        <Pressable onPress={props.onAssign} style={ss.iconBtn}>
          <UserPlus color={C.blue} size={16} />
        </Pressable>
      )}
      {props.canEdit ? (
        <>
          <Pressable onPress={props.onEdit} style={ss.iconBtn}>
            <Pencil color={C.muted} size={14} />
          </Pressable>
          <Pressable onPress={props.onDelete} style={ss.iconBtn}>
            <Trash2 color={C.muted} size={14} />
          </Pressable>
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
      item.exerciseLibraryId ?? item.warmupExerciseLibraryId ?? item.plioExerciseLibraryId ?? item.cardioMethodLibraryId;
    if (id && map[id]) return map[id] as string;
  }
  return WARMUP_PLACEHOLDER();
}

function useFiltered<T extends { name: string }>(items: T[], query: string): T[] {
  return useMemo(() => {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    const q = query.trim().toLowerCase();
    return q ? sorted.filter((i) => i.name.toLowerCase().includes(q)) : sorted;
  }, [items, query]);
}

type DeleteMutation = {
  mutate: (id: string, opts: { onSuccess: () => void; onError: (err: unknown) => void }) => void;
};

function buildConfirmDelete(
  pendingDeleteId: string,
  deleteKind: Tab,
  deleteRoutine: DeleteMutation,
  deleteWarmup: DeleteMutation,
  setPendingDeleteId: (id: string) => void,
  pendingName: string,
  setDeleteError: (msg: string | null) => void,
) {
  return () => {
    if (!pendingDeleteId) return;
    const onSuccess = () => setPendingDeleteId('');
    const onError = (err: unknown) => {
      const raw = (err as { message?: string })?.message ?? '';
      const isAssigned = raw.toLowerCase().includes('assigned');
      const name = pendingName ? `"${pendingName}"` : 'esta rutina';
      setDeleteError(
        isAssigned
          ? `No se puede eliminar ${name} porque está asignada a uno o más clientes activos. Desasígnala primero.`
          : `No se pudo eliminar ${name}. ${raw}`,
      );
    };
    if (deleteKind === 'routines') {
      deleteRoutine.mutate(pendingDeleteId, { onSuccess, onError });
    } else {
      deleteWarmup.mutate(pendingDeleteId, { onSuccess, onError });
    }
  };
}

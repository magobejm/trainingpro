import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { Trophy, Activity, Pencil, Trash2, Search, Plus } from 'lucide-react';
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

const C = {
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  blue: '#3b82f6',
  dot: '#f59e0b',
  white: '#ffffff',
};

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
  const routines = useRoutineTemplatesQuery().data ?? [];
  const warmups = useWarmupTemplatesQuery().data ?? [];
  const exercises = useUnifiedExercisesQuery({}).data ?? [];
  const mediaMap = useMemo<MediaMap>(() => Object.fromEntries(exercises.map((e) => [e.id, e.mediaUrl])), [exercises]);
  const openForEdit = useRoutinePlannerContextStore((s) => s.openForEdit);
  const clearRoutine = useRoutinePlannerContextStore((s) => s.clear);
  const setWarmupInitial = useWarmupPlannerContextStore((s) => s.setInitialTemplate);
  const clearWarmup = useWarmupPlannerContextStore((s) => s.clear);
  const deleteRoutine = useDeleteRoutineTemplateMutation();
  const deleteWarmup = useDeleteWarmupTemplateMutation();
  const filteredRoutines = useFiltered(routines, query);
  const filteredWarmups = useFiltered(warmups, query);
  const onConfirmDelete = buildConfirmDelete(pendingDeleteId, deleteKind, deleteRoutine, deleteWarmup, setPendingDeleteId);
  return {
    filteredRoutines,
    filteredWarmups,
    mediaMap,
    onConfirmDelete,
    onCreateRoutine: () => {
      clearRoutine();
      onRouteChange('coach.routine.planner');
    },
    onCreateWarmup: () => {
      clearWarmup();
      onRouteChange('coach.warmup.planner');
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
      setDeleteKind('routines');
      setPendingDeleteId(id);
    },
    onDeleteWarmup: (id: string) => {
      setDeleteKind('warmups');
      setPendingDeleteId(id);
    },
    pendingDeleteId,
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
          items={vm.filteredRoutines}
          mediaMap={vm.mediaMap}
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
        message={vm.t('coach.routine.delete.confirm')}
        onCancel={() => vm.setPendingDeleteId('')}
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
  items: RoutineTemplateView[];
  mediaMap: MediaMap;
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
          key={tpl.id}
          tpl={tpl}
          mediaUrl={pickRoutineImage(tpl, props.mediaMap)}
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
  tpl: RoutineTemplateView;
  mediaUrl: string;
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
      onPress={() => props.onEdit(tpl)}
      style={ss.card}
    >
      <CardTopBar
        canEdit={canEdit}
        icon={<Trophy color={C.blue} size={18} />}
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

function CardTopBar(props: { canEdit: boolean; icon: React.ReactNode; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={ss.cardTop}>
      <View style={ss.dot} />
      {props.icon}
      <View style={{ flex: 1 }} />
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

type DeleteMutation = { mutate: (id: string, opts: { onSuccess: () => void }) => void };

function buildConfirmDelete(
  pendingDeleteId: string,
  deleteKind: Tab,
  deleteRoutine: DeleteMutation,
  deleteWarmup: DeleteMutation,
  setPendingDeleteId: (id: string) => void,
) {
  return () => {
    if (!pendingDeleteId) return;
    const onSuccess = () => setPendingDeleteId('');
    if (deleteKind === 'routines') {
      deleteRoutine.mutate(pendingDeleteId, { onSuccess });
    } else {
      deleteWarmup.mutate(pendingDeleteId, { onSuccess });
    }
  };
}

/* ── Styles ── */

const ss = StyleSheet.create({
  container: { padding: 24, gap: 20, backgroundColor: C.bg, minHeight: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 24, fontWeight: '700', color: C.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: C.card,
    borderColor: C.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 240,
  },
  searchInput: { color: C.text, flex: 1, fontSize: 13, outlineStyle: 'none' } as object,
  createBtn: {
    alignItems: 'center',
    backgroundColor: C.blue,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createBtnText: { color: C.white, fontWeight: '600', fontSize: 13 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { paddingHorizontal: 16, paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.blue },
  tabText: { fontSize: 14, fontWeight: '600', color: C.muted },
  tabTextActive: { color: C.blue },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  empty: { color: C.muted, fontSize: 14, marginTop: 8 },
  card: {
    width: 'calc(25% - 18px)' as unknown as number,
    backgroundColor: C.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.dot },
  iconBtn: { padding: 4 },
  cardImg: {
    height: 160,
    width: '100%',
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgBackdrop: { ...StyleSheet.absoluteFillObject },
  imgShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,12,20,0.2)' },
  imgInner: {
    width: '100%',
    height: '100%',
    transitionProperty: 'transform',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'ease-in-out',
  } as object,
  imgInnerHovered: { transform: [{ scale: 1.12 }] },
  cardBody: { padding: 12, gap: 6 },
  cardName: { fontSize: 15, fontWeight: '700', color: C.text },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardMetaBlue: { fontSize: 12, fontWeight: '600', color: C.blue },
  cardMetaGray: { fontSize: 12, color: C.muted },
});

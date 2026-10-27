import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import {
  useClientManagementSectionsQuery,
  useUpdateClientManagementSectionsMutation,
  type ClientManagementSectionView,
} from '../../../data/hooks/useClientManagementSections';
import {
  archiveSection,
  buildSectionLists,
  reorderSectionsByActiveIndex,
  restoreSection,
} from './ClientProfileSectionsBoard.model';
import { styles } from './ClientProfileSectionsBoard.styles';
import type { SectionId, SectionItem } from './ClientProfileSectionsBoard.types';
import { ClientProfileArchivedDrawer } from './ClientProfileSectionsBoard.ArchivedDrawer';
import { ClientProfileSectionsBoardHeader } from './ClientProfileSectionsBoard.Header';
import { ClientProfileSectionRow } from './ClientProfileSectionsBoard.Row';
import { ClientTimelineDrawer } from './ClientTimelineDrawer';
import { useClientWellnessQuery, type ClientWellnessResponse } from '../../../data/hooks/useClientWellness';
import { useClientNutritionPlansQuery } from '../../../data/hooks/useNutrition';
import { readSetupData } from '../nutrition/nutrition-tdee.utils';
import type { NutritionPlan } from '../nutrition/nutrition.types';
import { useClientPhysicalTestsQuery, type ClientPhysicalTestAssignmentView } from '../../../data/hooks/usePhysicalTests';
import { useCoachTriage } from '../../../data/hooks/useCoachTriage';
import { useIncidentsQuery, type IncidentView } from '../../../data/hooks/useIncidents';
import { buildDefaultWellnessRange } from '../client-mood.helpers';

type Props = {
  clientId: string;
  hasTrainingPlan: boolean;
  onOpenChat?: () => void;
  onOpenIncidents?: () => void;
  onOpenMood?: () => void;
  onOpenNutrition?: () => void;
  onOpenProgress?: () => void;
  onOpenTests?: () => void;
  onOpenCompare?: () => void;
  onOpenMeasures?: () => void;
  onOpenTrainingPlanner: () => void;
  clientName: string;
  onUnassignTrainingPlan: () => void;
  t: (key: string, params?: Record<string, number | string>) => string;
  trainingPlanName?: string;
};

type BoardUiState = {
  openMenuId: null | SectionId;
  setOpenMenuId: (value: null | SectionId) => void;
  setShowArchivedDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  setShowTimeline: React.Dispatch<React.SetStateAction<boolean>>;
  showArchivedDrawer: boolean;
  showTimeline: boolean;
};

type BoardViewModel = {
  items: ClientManagementSectionView[];
  assignments: ClientPhysicalTestAssignmentView[];
  wellness: ClientWellnessResponse | undefined;
  onArchive: (id: SectionId) => Promise<void>;
  onCloseArchived: () => void;
  onCloseTimeline: () => void;
  onDropArchive: (sourceId: null | SectionId) => void;
  onDropReorderByIndex: (sourceIndex: null | number, targetIndex: number) => void;
  onRestore: (id: SectionId) => Promise<void>;
  onOpenTimeline: () => void;
  onToggleArchived: () => void;
  onToggleMenu: (id: SectionId) => void;
  openMenuId: null | SectionId;
  showArchivedDrawer: boolean;
  showTimeline: boolean;
};

export function ClientProfileSectionsBoard(props: Props): React.JSX.Element {
  const vm = useBoardViewModel(props.clientId);
  const lists = useMemo(() => buildSectionLists(vm.items), [vm.items]);
  const moodSubtitle = resolveMoodSubtitle(vm.wellness, props.t);
  const testsSubtitle = resolveNextTestSubtitle(vm.assignments, props.t);
  const nutritionPlans = useClientNutritionPlansQuery(props.clientId).data;
  const nutritionSubtitle = resolveNutritionSubtitle(nutritionPlans, props.t);
  const { i18n } = useTranslation();
  const unreadChat = useCoachTriage().query.data?.chat.find((row) => row.clientId === props.clientId);
  const chatSubtitle = unreadChatSince(unreadChat?.since, i18n.language, props.t);
  const incidents = useIncidentsQuery({ clientId: props.clientId }).data ?? [];
  const openIncidents = incidents.filter((row) => row.status === 'OPEN');
  const incidentSubtitle = latestIncidentSubtitle(incidents, i18n.language, props.t);
  return (
    <View style={styles.board}>
      <ClientProfileSectionsBoardHeader
        archivedCount={lists.archivedSections.length}
        onDropArchive={vm.onDropArchive}
        onToggleArchived={vm.onToggleArchived}
        t={props.t}
      />
      <View style={styles.mainList}>
        {lists.activeSections.map((item, index) =>
          renderRow(
            item,
            index,
            lists.activeSections.length,
            props,
            vm,
            Boolean(unreadChat),
            openIncidents.length,
            chatSubtitle,
            incidentSubtitle,
            moodSubtitle,
            testsSubtitle,
            nutritionSubtitle,
          ),
        )}
      </View>
      <ClientProfileArchivedDrawer
        archived={lists.archivedSections}
        onClose={vm.onCloseArchived}
        onRestore={vm.onRestore}
        t={props.t}
        visible={vm.showArchivedDrawer}
      />
      <ClientTimelineDrawer
        clientId={props.clientId}
        clientName={props.clientName}
        onClose={vm.onCloseTimeline}
        t={props.t}
        visible={vm.showTimeline}
      />
    </View>
  );
}

function useBoardViewModel(clientId: string): BoardViewModel {
  const ui = useBoardUiState();
  const items = useClientManagementSectionsQuery(clientId).data ?? [];
  const mutation = useUpdateClientManagementSectionsMutation(clientId);
  const range = useMemo(() => buildDefaultWellnessRange(), []);
  const wellness = useClientWellnessQuery(clientId, range.dateFrom, range.dateTo).data;
  const assignments = useClientPhysicalTestsQuery(clientId).data ?? [];
  return {
    assignments,
    items,
    wellness,
    onArchive: (id) => saveItems(mutation, archiveSection(items, id), ui.setOpenMenuId),
    onCloseArchived: () => ui.setShowArchivedDrawer(false),
    onCloseTimeline: () => ui.setShowTimeline(false),
    onDropArchive: (sourceId) => onDropArchive(items, sourceId, mutation, ui.setOpenMenuId),
    onDropReorderByIndex: (sourceIndex, targetIndex) => onDropReorderByIndex(items, sourceIndex, targetIndex, mutation),
    onOpenTimeline: () => openTimeline(ui),
    onRestore: (id) => saveItems(mutation, restoreSection(items, id), ui.setOpenMenuId),
    onToggleArchived: () => toggleArchived(ui),
    onToggleMenu: (id) => ui.setOpenMenuId(ui.openMenuId === id ? null : id),
    openMenuId: ui.openMenuId,
    showArchivedDrawer: ui.showArchivedDrawer,
    showTimeline: ui.showTimeline,
  };
}

function useBoardUiState(): BoardUiState {
  const [openMenuId, setOpenMenuId] = useState<null | SectionId>(null);
  const [showArchivedDrawer, setShowArchivedDrawer] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  return { openMenuId, setOpenMenuId, setShowArchivedDrawer, setShowTimeline, showArchivedDrawer, showTimeline };
}

function openTimeline(ui: BoardUiState): void {
  ui.setOpenMenuId(null);
  ui.setShowArchivedDrawer(false);
  ui.setShowTimeline(true);
}

function toggleArchived(ui: BoardUiState): void {
  ui.setShowTimeline(false);
  ui.setShowArchivedDrawer((value) => !value);
}

function renderRow(
  item: SectionItem,
  index: number,
  total: number,
  props: Props,
  vm: BoardViewModel,
  chatUnread: boolean,
  incidentCount: number,
  chatSubtitle?: string,
  incidentSubtitle?: string,
  moodSubtitle?: string,
  testsSubtitle?: string,
  nutritionSubtitle?: string,
): React.JSX.Element {
  return (
    <ClientProfileSectionRow
      key={item.id}
      chatSubtitle={chatSubtitle}
      chatUnread={chatUnread}
      incidentCount={incidentCount}
      incidentSubtitle={incidentSubtitle}
      hasTrainingPlan={props.hasTrainingPlan}
      item={item}
      moodSubtitle={moodSubtitle}
      nutritionSubtitle={nutritionSubtitle}
      testsSubtitle={testsSubtitle}
      onArchive={() => void vm.onArchive(item.id)}
      onDropReorderByIndex={vm.onDropReorderByIndex}
      onOpenChat={props.onOpenChat}
      onOpenIncidents={props.onOpenIncidents}
      onOpenMood={props.onOpenMood}
      onOpenNutrition={props.onOpenNutrition}
      onOpenProgress={props.onOpenProgress}
      onOpenTests={props.onOpenTests}
      onOpenCompare={props.onOpenCompare}
      onOpenMeasures={props.onOpenMeasures}
      onOpenTimeline={vm.onOpenTimeline}
      onOpenTrainingPlanner={props.onOpenTrainingPlanner}
      onToggleMenu={() => vm.onToggleMenu(item.id)}
      onUnassignTrainingPlan={props.onUnassignTrainingPlan}
      placeMenuUp={index >= total - 2}
      rowIndex={index}
      showMenu={vm.openMenuId === item.id}
      t={props.t}
      trainingPlanName={props.trainingPlanName}
      clientId={props.clientId}
    />
  );
}

function latestIncidentSubtitle(incidents: IncidentView[], language: string, t: Props['t']): string | undefined {
  const latest = [...incidents].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  if (!latest) return undefined;
  const reviewed = Boolean(latest.reviewedAt);
  return t(reviewed ? 'coach.clientProfile.details.incidents.reviewed' : 'coach.clientProfile.details.incidents.latest', {
    date: formatOpenedAt(latest.reviewedAt ?? latest.createdAt, language),
    text: excerpt(latest.description),
  });
}

function excerpt(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 90) return clean;
  return `${clean.slice(0, 87).trimEnd()}…`;
}

function formatOpenedAt(value: string, language: string): string {
  return new Date(value).toLocaleString(language, { day: 'numeric', hour: '2-digit', minute: '2-digit', month: 'short' });
}

function unreadChatSince(since: string | undefined, language: string, t: Props['t']): string | undefined {
  if (!since) return undefined;
  const date = new Date(since).toLocaleString(language, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
  return t('coach.clientProfile.details.chat.unreadSince', { date });
}

function resolveNutritionSubtitle(plans: NutritionPlan[] | undefined, t: Props['t']): string | undefined {
  const plan = plans?.find((item) => item.type === 'ESTRUCTURADO') ?? plans?.[0];
  if (!plan) return undefined;
  const calories = readSetupData(plan.setupData)?.targetCalories;
  if (calories == null) return plan.name;
  return t('coach.clientProfile.details.nutritionPlan.summary', { kcal: Math.round(calories), name: plan.name });
}

function resolveNextTestSubtitle(assignments: ClientPhysicalTestAssignmentView[], t: Props['t']): string | undefined {
  const today = localDateKey(new Date());
  const upcoming = assignments.flatMap((assignment) =>
    assignment.schedules
      .filter((schedule) => !schedule.done && schedule.scheduledDate >= today)
      .map((schedule) => ({ date: schedule.scheduledDate, name: assignment.physicalTest.name })),
  );
  upcoming.sort((left, right) => left.date.localeCompare(right.date));
  const next = upcoming[0];
  if (!next) return undefined;
  return t('coach.clientProfile.details.tests.next', { date: formatScheduleDate(next.date), name: next.name });
}

function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatScheduleDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function resolveMoodSubtitle(wellness: ClientWellnessResponse | undefined, t: Props['t']): string | undefined {
  if (!wellness) return undefined;
  if (wellness.summary.reportsCount > 0) {
    return t('coach.clientProfile.details.mood.reportsCount', { count: wellness.summary.reportsCount });
  }
  if (wellness.summary.sessionsWithWellness > 0) {
    return t('coach.clientProfile.details.mood.sessionsCount', { count: wellness.summary.sessionsWithWellness });
  }
  return undefined;
}

function onDropReorderByIndex(
  items: ClientManagementSectionView[],
  sourceIndex: null | number,
  targetIndex: number,
  mutation: ReturnType<typeof useUpdateClientManagementSectionsMutation>,
): void {
  if (sourceIndex === null) return;
  const next = reorderSectionsByActiveIndex(items, sourceIndex, targetIndex);
  void mutation.mutateAsync(next);
}

function onDropArchive(
  items: ClientManagementSectionView[],
  sourceId: null | SectionId,
  mutation: ReturnType<typeof useUpdateClientManagementSectionsMutation>,
  setOpenMenuId: (value: null | SectionId) => void,
): void {
  if (!sourceId) return;
  setOpenMenuId(null);
  void mutation.mutateAsync(archiveSection(items, sourceId));
}

async function saveItems(
  mutation: ReturnType<typeof useUpdateClientManagementSectionsMutation>,
  items: ClientManagementSectionView[],
  setOpenMenuId: (value: null | SectionId) => void,
): Promise<void> {
  setOpenMenuId(null);
  await mutation.mutateAsync(items);
}

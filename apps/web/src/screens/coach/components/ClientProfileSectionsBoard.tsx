import React, { useMemo, useState } from 'react';
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
import { useClientWellnessQuery, type ClientWellnessResponse } from '../../../data/hooks/useClientWellness';
import { buildDefaultWellnessRange } from '../client-mood.helpers';

type Props = {
  clientId: string;
  hasTrainingPlan: boolean;
  onOpenMood?: () => void;
  onOpenNutrition?: () => void;
  onOpenProgress?: () => void;
  onOpenTests?: () => void;
  onOpenTrainingPlanner: () => void;
  onUnassignTrainingPlan: () => void;
  t: (key: string, params?: Record<string, number | string>) => string;
  trainingPlanName?: string;
};

type BoardUiState = {
  openMenuId: null | SectionId;
  setOpenMenuId: (value: null | SectionId) => void;
  setShowArchivedDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  showArchivedDrawer: boolean;
};

type BoardViewModel = {
  items: ClientManagementSectionView[];
  wellness: ClientWellnessResponse | undefined;
  onArchive: (id: SectionId) => Promise<void>;
  onCloseArchived: () => void;
  onDropArchive: (sourceId: null | SectionId) => void;
  onDropReorderByIndex: (sourceIndex: null | number, targetIndex: number) => void;
  onRestore: (id: SectionId) => Promise<void>;
  onToggleArchived: () => void;
  onToggleMenu: (id: SectionId) => void;
  openMenuId: null | SectionId;
  showArchivedDrawer: boolean;
};

export function ClientProfileSectionsBoard(props: Props): React.JSX.Element {
  const vm = useBoardViewModel(props.clientId);
  const lists = useMemo(() => buildSectionLists(vm.items), [vm.items]);
  const moodSubtitle = resolveMoodSubtitle(vm.wellness, props.t);
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
          renderRow(item, index, lists.activeSections.length, props, vm, moodSubtitle),
        )}
      </View>
      <ClientProfileArchivedDrawer
        archived={lists.archivedSections}
        onClose={vm.onCloseArchived}
        onRestore={vm.onRestore}
        t={props.t}
        visible={vm.showArchivedDrawer}
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
  return {
    items,
    wellness,
    onArchive: (id) => saveItems(mutation, archiveSection(items, id), ui.setOpenMenuId),
    onCloseArchived: () => ui.setShowArchivedDrawer(false),
    onDropArchive: (sourceId) => onDropArchive(items, sourceId, mutation, ui.setOpenMenuId),
    onDropReorderByIndex: (sourceIndex, targetIndex) => onDropReorderByIndex(items, sourceIndex, targetIndex, mutation),
    onRestore: (id) => saveItems(mutation, restoreSection(items, id), ui.setOpenMenuId),
    onToggleArchived: () => ui.setShowArchivedDrawer((value) => !value),
    onToggleMenu: (id) => ui.setOpenMenuId(ui.openMenuId === id ? null : id),
    openMenuId: ui.openMenuId,
    showArchivedDrawer: ui.showArchivedDrawer,
  };
}

function useBoardUiState(): BoardUiState {
  const [openMenuId, setOpenMenuId] = useState<null | SectionId>(null);
  const [showArchivedDrawer, setShowArchivedDrawer] = useState(false);
  return { openMenuId, setOpenMenuId, setShowArchivedDrawer, showArchivedDrawer };
}

function renderRow(
  item: SectionItem,
  index: number,
  total: number,
  props: Props,
  vm: BoardViewModel,
  moodSubtitle?: string,
): React.JSX.Element {
  return (
    <ClientProfileSectionRow
      key={item.id}
      hasTrainingPlan={props.hasTrainingPlan}
      item={item}
      moodSubtitle={moodSubtitle}
      onArchive={() => void vm.onArchive(item.id)}
      onDropReorderByIndex={vm.onDropReorderByIndex}
      onOpenMood={props.onOpenMood}
      onOpenNutrition={props.onOpenNutrition}
      onOpenProgress={props.onOpenProgress}
      onOpenTests={props.onOpenTests}
      onOpenTrainingPlanner={props.onOpenTrainingPlanner}
      onToggleMenu={() => vm.onToggleMenu(item.id)}
      onUnassignTrainingPlan={props.onUnassignTrainingPlan}
      placeMenuUp={index >= total - 2}
      rowIndex={index}
      showMenu={vm.openMenuId === item.id}
      t={props.t}
      trainingPlanName={props.trainingPlanName}
    />
  );
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

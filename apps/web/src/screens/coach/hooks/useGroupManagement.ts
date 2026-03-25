import { useState, useCallback } from 'react';
import type { DraftBlock, DraftDay, DraftExerciseGroup } from '../RoutinePlanner.types';
import { nextGroupId } from '../RoutinePlanner.helpers';

export type GroupMode = 'CIRCUIT' | 'SUPERSET' | null;

export interface UseGroupManagementResult {
  groupMode: GroupMode;
  selectedBlockIds: string[];
  startGroupMode: (mode: 'CIRCUIT' | 'SUPERSET') => void;
  cancelGroupMode: () => void;
  toggleBlockSelection: (blockId: string) => void;
  confirmGroup: (day: DraftDay, note?: string) => DraftDay;
  removeGroup: (day: DraftDay, groupId: string) => DraftDay;
  updateGroupNote: (day: DraftDay, groupId: string, note: string) => DraftDay;
}

export function useGroupManagement(): UseGroupManagementResult {
  const [groupMode, setGroupMode] = useState<GroupMode>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);

  const startGroupMode = useCallback((mode: 'CIRCUIT' | 'SUPERSET') => {
    setGroupMode(mode);
    setSelectedBlockIds([]);
  }, []);

  const cancelGroupMode = useCallback(() => {
    setGroupMode(null);
    setSelectedBlockIds([]);
  }, []);

  const toggleBlockSelection = useCallback((blockId: string) => {
    setSelectedBlockIds((prev) => (prev.includes(blockId) ? prev.filter((id) => id !== blockId) : [...prev, blockId]));
  }, []);

  const confirmGroup = useCallback(
    (day: DraftDay, note?: string): DraftDay => {
      if (!groupMode || selectedBlockIds.length < 2) return day;
      const newGroupId = nextGroupId();
      const maxSortOrder = (day.groups ?? []).reduce((max, g) => Math.max(max, g.sortOrder), -1);
      const newGroup: DraftExerciseGroup = {
        id: newGroupId,
        groupType: groupMode,
        note,
        sortOrder: maxSortOrder + 1,
      };
      const updatedBlocks: DraftBlock[] = day.blocks.map((block) =>
        selectedBlockIds.includes(block.id) ? { ...block, groupId: newGroupId } : block,
      );
      setGroupMode(null);
      setSelectedBlockIds([]);
      return {
        ...day,
        blocks: updatedBlocks,
        groups: [...(day.groups ?? []), newGroup],
      };
    },
    [groupMode, selectedBlockIds],
  );

  const removeGroup = useCallback((day: DraftDay, groupId: string): DraftDay => {
    const updatedBlocks = day.blocks.map((block) => (block.groupId === groupId ? { ...block, groupId: undefined } : block));
    return {
      ...day,
      blocks: updatedBlocks,
      groups: (day.groups ?? []).filter((g) => g.id !== groupId),
    };
  }, []);

  const updateGroupNote = useCallback((day: DraftDay, groupId: string, note: string): DraftDay => {
    return {
      ...day,
      groups: (day.groups ?? []).map((g) => (g.id === groupId ? { ...g, note } : g)),
    };
  }, []);

  return {
    groupMode,
    selectedBlockIds,
    startGroupMode,
    cancelGroupMode,
    toggleBlockSelection,
    confirmGroup,
    removeGroup,
    updateGroupNote,
  };
}

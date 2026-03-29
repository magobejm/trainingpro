/* eslint-disable max-lines-per-function */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react';
import { createBlock } from './RoutinePlanner.helpers';
import type { BlockType, DraftDay } from './RoutinePlanner.types';
import { EMPTY_DRAFT, fromTemplate, moveBlocks, toPayload, type DraftState } from './WarmupPlannerScreen.helpers';
import { s } from './RoutinePlanner.styles';
import { AddBlockSection } from './components/RoutineDayCard/AddBlockSection';
import { GroupContainer } from './components/RoutineDayCard/GroupContainer';
import { RoutineBlockCard } from './components/RoutineBlockCard';
import { ExercisePickerModal } from './components/RoutinePlanner/ExercisePickerModal';
import { SaveWarmupModal } from './components/RoutinePlanner/SaveWarmupModal';
import { useGroupManagement } from './hooks/useGroupManagement';
import {
  useCreateWarmupTemplateMutation,
  useUpdateWarmupTemplateMutation,
  useWarmupTemplatesQuery,
} from '../../data/hooks/useWarmupTemplates';
import { useWarmupPlannerContextStore } from '../../store/warmupPlannerContext.store';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';

const WARMUP_BLOCK_TYPES: BlockType[] = ['strength', 'cardio', 'plio', 'mobility', 'isometric', 'sport'];

type Props = { onRouteChange: (route: ShellRoute) => void };

export function WarmupPlannerScreen({ onRouteChange }: Props): React.JSX.Element {
  const vm = useViewModel(onRouteChange);
  return <WarmupPlannerView vm={vm} />;
}

/** Converts DraftState (warmup-level) to a DraftDay-compatible shape for useGroupManagement */
function toDraftDay(draft: DraftState): DraftDay {
  return { blocks: draft.blocks, groups: draft.groups, id: 'warmup', title: '' };
}

function useViewModel(onRouteChange: (route: ShellRoute) => void) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<null | string>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [pickerType, setPickerType] = useState<null | BlockType>(null);
  const [showTypeButtons, setShowTypeButtons] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { data: list = [], isFetching } = useWarmupTemplatesQuery();
  const createMutation = useCreateWarmupTemplateMutation();
  const updateMutation = useUpdateWarmupTemplateMutation(editingId ?? '');
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    groupMode,
    selectedBlockIds,
    startGroupMode,
    cancelGroupMode,
    toggleBlockSelection,
    confirmGroup,
    removeGroup,
    updateGroupNote,
  } = useGroupManagement();

  const orderedBlocks = [...draft.blocks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const initialTemplateId = useWarmupPlannerContextStore((st) => st.initialTemplateId);
  const viewOnly = useWarmupPlannerContextStore((st) => st.viewOnly);
  const clearWarmupContext = useWarmupPlannerContextStore((st) => st.clear);

  useEffect(() => {
    if (!initialTemplateId || list.length === 0 || isFetching) return;
    const tpl = list.find((item) => item.id === initialTemplateId);
    if (!tpl) return;
    const isGlobal = tpl.scope === 'GLOBAL';
    setEditingId(isGlobal ? null : tpl.id);
    setIsReadOnly(isGlobal || viewOnly);
    setDraft(fromTemplate(tpl));
    clearWarmupContext();
  }, [initialTemplateId, list, isFetching, clearWarmupContext, viewOnly]);

  const handleConfirmGroup = () => {
    const updated = confirmGroup(toDraftDay(draft));
    setDraft((prev) => ({ ...prev, blocks: updated.blocks, groups: updated.groups ?? [] }));
  };

  const handleRemoveGroup = (groupId: string) => {
    const updated = removeGroup(toDraftDay(draft), groupId);
    setDraft((prev) => ({ ...prev, blocks: updated.blocks, groups: updated.groups ?? [] }));
  };

  const handleUpdateGroupNote = (groupId: string, note: string) => {
    const updated = updateGroupNote(toDraftDay(draft), groupId, note);
    setDraft((prev) => ({ ...prev, groups: updated.groups ?? [] }));
  };

  const onSave = (name: string) => {
    const payload = { ...toPayload(draft), name };
    const onSuccess = () => {
      setShowSaveModal(false);
      setDraft(EMPTY_DRAFT);
      setEditingId(null);
      onRouteChange('coach.library.warmups');
    };
    if (editingId) {
      updateMutation.mutate(payload, { onSuccess });
    } else {
      createMutation.mutate(payload, { onSuccess });
    }
  };

  return {
    draft,
    editingId,
    groupMode,
    handleConfirmGroup,
    handleRemoveGroup,
    handleUpdateGroupNote,
    isReadOnly,
    isSaving,
    onRouteChange,
    onSave,
    orderedBlocks,
    pickerType,
    selectedBlockIds,
    setDraft,
    setPickerType,
    setShowSaveModal,
    setShowTypeButtons,
    showSaveModal,
    showTypeButtons,
    startGroupMode,
    cancelGroupMode,
    t,
    toggleBlockSelection,
  };
}

type VM = ReturnType<typeof useViewModel>;

function WarmupPlannerView({ vm }: { vm: VM }): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={s.page}>
      <WarmupPlannerHeader vm={vm} />
      <WarmupBlocksCard vm={vm} />
      {!vm.isReadOnly && (
        <Pressable onPress={() => vm.setShowSaveModal(true)} style={s.saveBtn}>
          <Text style={s.saveBtnText}>{vm.t('coach.warmupPlanner.save')}</Text>
        </Pressable>
      )}
      <ExercisePickerModal
        blockType={vm.pickerType}
        onCancel={() => vm.setPickerType(null)}
        onSelect={(libraryId, name) => {
          const type = vm.pickerType;
          if (!type) return;
          vm.setDraft((state) => ({
            ...state,
            blocks: [...state.blocks, { ...createBlock(type, name), libraryId, sortOrder: state.blocks.length }],
          }));
          vm.setPickerType(null);
        }}
        t={vm.t}
      />
      <SaveWarmupModal
        initialName={vm.draft.name}
        isSaving={vm.isSaving}
        onClose={() => vm.setShowSaveModal(false)}
        onSave={vm.onSave}
        t={vm.t}
        visible={vm.showSaveModal}
      />
    </ScrollView>
  );
}

const headerStyles = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 16, marginBottom: 4 };
const backBtnStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, padding: 4 };
const backBtnTextStyle = { fontSize: 14, color: '#64748b' as const };

function WarmupPlannerHeader({ vm }: { vm: VM }): React.JSX.Element {
  return (
    <View style={headerStyles}>
      <Pressable onPress={() => vm.onRouteChange('coach.library.warmups')} style={backBtnStyle}>
        <ArrowLeft color={'#64748b'} size={18} />
        <Text style={backBtnTextStyle}>{vm.t('coach.warmupPlanner.back')}</Text>
      </Pressable>
      <Text style={s.title}>{vm.t('coach.warmupPlanner.title')}</Text>
    </View>
  );
}

function WarmupBlocksCard({ vm }: { vm: VM }): React.JSX.Element {
  return (
    <View style={s.card}>
      {!vm.isReadOnly && (
        <View style={s.dayHeaderRight}>
          <Pressable onPress={() => vm.setShowTypeButtons(true)} style={s.dayAddExerciseBtn}>
            <Text style={s.dayAddExerciseBtnText}>{`+ ${vm.t('coach.routine.addExercise')}`}</Text>
          </Pressable>
        </View>
      )}
      {!vm.isReadOnly && (
        <WarmupGroupModeBar
          groupMode={vm.groupMode}
          selectedCount={vm.selectedBlockIds.length}
          t={vm.t}
          onStartCircuit={() => vm.startGroupMode('CIRCUIT')}
          onCancel={vm.cancelGroupMode}
          onConfirm={vm.handleConfirmGroup}
        />
      )}
      {vm.orderedBlocks.length === 0 ? <Text style={s.emptyDay}>{vm.t('coach.warmupPlanner.emptyGroup')}</Text> : null}
      <WarmupBlocksContent vm={vm} />
      {!vm.isReadOnly && vm.showTypeButtons && (
        <AddBlockSection
          isAdding={vm.showTypeButtons}
          onAdd={(type) => {
            vm.setPickerType(type);
            vm.setShowTypeButtons(false);
          }}
          onCancel={() => vm.setShowTypeButtons(false)}
          t={vm.t}
          types={WARMUP_BLOCK_TYPES}
        />
      )}
    </View>
  );
}

function WarmupBlocksContent({ vm }: { vm: VM }): React.JSX.Element {
  const { orderedBlocks, draft, isReadOnly, groupMode, selectedBlockIds } = vm;
  const groups = draft.groups ?? [];
  const groupedBlockIds = new Set(orderedBlocks.filter((b) => b.groupId).map((b) => b.groupId!));
  const renderedGroupIds = new Set<string>();
  const isInGroupMode = !!groupMode;

  const elements: React.ReactNode[] = [];

  orderedBlocks.forEach((block, index) => {
    if (block.groupId && !renderedGroupIds.has(block.groupId)) {
      const group = groups.find((g) => g.id === block.groupId);
      if (group) {
        renderedGroupIds.add(group.id);
        const groupBlocks = orderedBlocks.filter((b) => b.groupId === group.id);
        elements.push(
          <GroupContainer
            key={`group-${group.id}`}
            group={group}
            blocks={groupBlocks}
            dayIdx={0}
            daysCount={1}
            dayLabels={['']}
            hideAdvanced
            readOnly={isReadOnly}
            allBlocks={orderedBlocks}
            onMoveBlock={(idx, dir) => vm.setDraft((state) => ({ ...state, blocks: moveBlocks(state.blocks, idx, dir) }))}
            onMoveBlockToDay={() => undefined}
            onRemoveBlock={(id) => vm.setDraft((state) => ({ ...state, blocks: state.blocks.filter((b) => b.id !== id) }))}
            onUpdateBlockField={(id, field, value) =>
              vm.setDraft((state) => ({
                ...state,
                blocks: state.blocks.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
              }))
            }
            onUpdateGroupNote={vm.handleUpdateGroupNote}
            onRemoveGroup={vm.handleRemoveGroup}
          />,
        );
        return;
      }
    }

    if (block.groupId) return;

    const isSelected = selectedBlockIds.includes(block.id);
    const isGrouped = groupedBlockIds.has(block.id);

    elements.push(
      <div
        key={block.id}
        draggable={!isReadOnly && !isInGroupMode}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', index.toString());
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (isReadOnly) return;
          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
          if (!isNaN(fromIndex) && fromIndex !== index) {
            vm.setDraft((state) => {
              const sorted = [...state.blocks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
              const [moved] = sorted.splice(fromIndex, 1);
              if (moved) sorted.splice(index, 0, moved);
              return { ...state, blocks: sorted.map((b, i) => ({ ...b, sortOrder: i })) };
            });
          }
        }}
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', borderRadius: 10 }}
      >
        {isInGroupMode && !isGrouped && (
          <SelectionOverlay selected={isSelected} onPress={() => vm.toggleBlockSelection(block.id)} />
        )}
        <RoutineBlockCard
          block={block}
          dayIdx={0}
          dayLabels={['']}
          daysCount={1}
          hideAdvanced
          isFirst={index === 0}
          isLast={index === orderedBlocks.length - 1}
          onMove={(direction) =>
            isReadOnly
              ? undefined
              : vm.setDraft((state) => ({
                  ...state,
                  blocks: moveBlocks(state.blocks, index, direction),
                }))
          }
          onMoveToDay={() => undefined}
          onRemove={() =>
            isReadOnly
              ? undefined
              : vm.setDraft((state) => ({
                  ...state,
                  blocks: state.blocks.filter((item) => item.id !== block.id),
                }))
          }
          onUpdateField={(field, value) =>
            isReadOnly
              ? undefined
              : vm.setDraft((state) => ({
                  ...state,
                  blocks: state.blocks.map((item) => (item.id === block.id ? { ...item, [field]: value } : item)),
                }))
          }
          readOnly={isReadOnly || isInGroupMode}
        />
      </div>,
    );
  });

  return <>{elements}</>;
}

function SelectionOverlay({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        backgroundColor: selected ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.02)',
        borderRadius: 10,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#3b82f6' : '#93c5fd',
        borderStyle: selected ? 'solid' : 'dashed',
      }}
    />
  );
}

interface WarmupGroupModeBarProps {
  groupMode: 'CIRCUIT' | 'SUPERSET' | null;
  selectedCount: number;
  t: VM['t'];
  onStartCircuit: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function WarmupGroupModeBar({ groupMode, selectedCount, t, onStartCircuit, onCancel, onConfirm }: WarmupGroupModeBarProps) {
  if (!groupMode) {
    return (
      <View style={gbs.bar}>
        <TouchableOpacity onPress={onStartCircuit} style={gbs.circuitBtn}>
          <Text style={gbs.circuitBtnText}>{t('coach.routine.group.addCircuit')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={[gbs.bar, gbs.activeBar]}>
      <Text style={gbs.hint}>
        {t('coach.routine.group.selectHint', { label: t('coach.routine.group.circuit'), count: selectedCount })}
      </Text>
      <View style={gbs.spacer} />
      <TouchableOpacity onPress={onCancel} style={gbs.cancelBtn}>
        <Text style={gbs.cancelBtnText}>{t('coach.routine.delete.cancel')}</Text>
      </TouchableOpacity>
      {selectedCount >= 2 && (
        <TouchableOpacity onPress={onConfirm} style={gbs.confirmBtn}>
          <Text style={gbs.confirmBtnText}>
            {t('coach.routine.group.create', { label: t('coach.routine.group.circuit') })}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const gbs = {
  bar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  activeBar: { backgroundColor: '#eff6ff' },
  circuitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93c5fd',
    backgroundColor: '#dbeafe',
  },
  circuitBtnText: { fontSize: 11, fontWeight: '600' as const, color: '#1d4ed8' },
  hint: { fontSize: 12, color: '#475569' },
  spacer: { flex: 1 },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#f1f5f9' },
  cancelBtnText: { fontSize: 11, color: '#64748b' },
  confirmBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: '#3b82f6' },
  confirmBtnText: { fontSize: 11, fontWeight: '700' as const, color: '#fff' },
};

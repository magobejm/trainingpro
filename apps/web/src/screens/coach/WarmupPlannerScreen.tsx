import { EmptyIllustration } from '../../components/EmptyIllustrations';
import { getLayoutStyle1, getLayoutStyle2 } from './WarmupPlannerScreen.layout-styles';

import { WebBox } from '@trainerpro/ui';
/* eslint-disable max-lines-per-function */
/* eslint-disable max-lines-per-function */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react';
import { createBlock } from './RoutinePlanner.helpers';
import type { BlockType, DraftDay } from './RoutinePlanner.types';
import { EMPTY_DRAFT, fromTemplate, moveBlocks, toPayload, type DraftState } from './WarmupPlannerScreen.helpers';
import { s } from './RoutinePlanner.styles';
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
import { UnsavedStatus, UnsavedWorkDialogs } from '../../layout/UnsavedWorkDialogs';
import { saveTemplate } from '../../layout/template-save';
import { useUnsavedWork } from '../../layout/useUnsavedWork';
import { Button, colors, EmptyState, fontSize, space } from '@trainerpro/ui';
const WARMUP_BLOCK_TYPES: BlockType[] = ['strength', 'cardio', 'plio', 'mobility', 'isometric', 'sport'];
type Props = {
  onRouteChange: (route: ShellRoute) => void;
};
export function WarmupPlannerScreen({ onRouteChange }: Props): React.JSX.Element {
  const vm = useViewModel(onRouteChange);
  return (
    <>
      <UnsavedWorkDialogs
        onOverwrite={() => vm.onSave(vm.lastSaveName.current)}
        onReload={() => {
          vm.work.release();
          window.location.reload();
        }}
        t={vm.t}
        work={vm.work}
      />
      <WarmupPlannerView vm={vm} />
    </>
  );
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
  const fromLibrary = useWarmupPlannerContextStore((st) => st.fromLibrary);
  const clearInitialTemplate = useWarmupPlannerContextStore((st) => st.clearInitialTemplate);
  const templateKey = initialTemplateId ?? editingId ?? 'new';
  const work = useUnsavedWork({
    onRestore: setDraft,
    storageKey: `trainerpro.draft.warmup.${templateKey}`,
    value: draft,
  });
  const lastSaveName = React.useRef('');
  const adoptRef = React.useRef(work.adopt);
  adoptRef.current = work.adopt;
  useEffect(() => {
    if (!initialTemplateId || list.length === 0 || isFetching) return;
    const tpl = list.find((item) => item.id === initialTemplateId);
    if (!tpl) return;
    const isGlobal = tpl.scope === 'GLOBAL';
    const next = fromTemplate(tpl);
    setEditingId(isGlobal ? null : tpl.id);
    setIsReadOnly(isGlobal || viewOnly);
    setDraft(next);
    adoptRef.current(next, tpl.templateVersion);
    clearInitialTemplate();
  }, [initialTemplateId, list, isFetching, clearInitialTemplate, viewOnly]);
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
    lastSaveName.current = name;
    const payload = { ...toPayload(draft), name };
    void saveTemplate(work, editingId, (fields) => {
      const body = { ...payload, ...fields };
      return fields.templateId ? updateMutation.mutateAsync(body) : createMutation.mutateAsync(body);
    })
      .then(() => {
        work.release(EMPTY_DRAFT);
        setShowSaveModal(false);
        setDraft(EMPTY_DRAFT);
        setEditingId(null);
        onRouteChange('coach.library.warmups');
      })
      .catch(() => undefined);
  };
  return {
    draft,
    editingId,
    groupMode,
    handleConfirmGroup,
    handleRemoveGroup,
    handleUpdateGroupNote,
    isReadOnly,
    isSaving: isSaving || work.saving,
    lastSaveName,
    onRouteChange,
    onSave,
    orderedBlocks,
    pickerType,
    selectedBlockIds,
    setDraft,
    setPickerType,
    setShowSaveModal,
    showSaveModal,
    startGroupMode,
    cancelGroupMode,
    fromLibrary,
    t,
    work,
    toggleBlockSelection,
  };
}
type VM = ReturnType<typeof useViewModel>;
function WarmupPlannerView({ vm }: { vm: VM }): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={s.page}>
      <UnsavedStatus t={vm.t} work={vm.work} />
      <WarmupPlannerHeader vm={vm} />
      <WarmupBlocksCard vm={vm} />
      {!vm.isReadOnly && (
        <Button
          disabled={vm.isSaving}
          label={vm.t('coach.warmupPlanner.save')}
          loading={vm.isSaving}
          onPress={() => vm.setShowSaveModal(true)}
          fullWidth
        />
      )}
      <ExercisePickerModal
        allowedTypes={WARMUP_BLOCK_TYPES}
        blockType={vm.pickerType}
        onCancel={() => vm.setPickerType(null)}
        onSelect={(libraryId, name, type) => {
          vm.setDraft((state) => ({
            ...state,
            blocks: [...state.blocks, { ...createBlock(type, name), libraryId, sortOrder: state.blocks.length }],
          }));
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
const headerStyles = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: space.lg, marginBottom: space.xs };
function WarmupPlannerHeader({ vm }: { vm: VM }): React.JSX.Element {
  return (
    <View style={headerStyles}>
      {vm.fromLibrary ? (
        <Button
          icon={<ArrowLeft color={colors.textMuted} size={18} />}
          label={vm.t('coach.warmupPlanner.back')}
          onPress={() => {
            useWarmupPlannerContextStore.getState().clear();
            vm.onRouteChange('coach.library.warmups');
          }}
          size="sm"
          variant="ghost"
        />
      ) : null}
      <Text style={s.title}>{vm.t('coach.warmupPlanner.title')}</Text>
    </View>
  );
}
function WarmupBlocksCard({ vm }: { vm: VM }): React.JSX.Element {
  return (
    <View style={s.card}>
      {!vm.isReadOnly && (
        <View style={s.dayHeaderRight}>
          <Button
            label={`+ ${vm.t('coach.routine.addExercise')}`}
            onPress={() => vm.setPickerType(WARMUP_BLOCK_TYPES[0] ?? 'strength')}
            size="sm"
            variant="secondary"
          />
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
      {vm.orderedBlocks.length === 0 ? (
        <EmptyState icon={<EmptyIllustration kind={'library'} />}
          actionLabel={vm.isReadOnly ? undefined : `+ ${vm.t('coach.routine.addExercise')}`}
          message={vm.t('coach.warmupPlanner.emptyGroup')}
          onAction={() => vm.setPickerType(WARMUP_BLOCK_TYPES[0] ?? 'strength')}
          title={vm.t('coach.warmupPlanner.emptyTitle')}
        />
      ) : null}
      <WarmupBlocksContent vm={vm} />
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
    const layoutStyle1 = getLayoutStyle1;
    elements.push(
      <WebBox
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
        style={layoutStyle1}
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
      </WebBox>,
    );
  });
  return <>{elements}</>;
}
function SelectionOverlay({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  const layoutStyle2 = getLayoutStyle2(
    selected ? colors.primarySoft : colors.surfaceMuted,
    selected ? 2 : 1,
    selected ? colors.primary : colors.primaryBorder,
    selected ? 'solid' : 'dashed',
  );
  return <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={layoutStyle2} />;
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
        <Button label={t('coach.routine.group.addCircuit')} onPress={onStartCircuit} size="sm" variant="secondary" />
      </View>
    );
  }
  return (
    <View style={[gbs.bar, gbs.activeBar]}>
      <Text style={gbs.hint}>
        {t('coach.routine.group.selectHint', { label: t('coach.routine.group.circuit'), count: selectedCount })}
      </Text>
      <View style={gbs.spacer} />
      <Button label={t('coach.routine.delete.cancel')} onPress={onCancel} size="sm" variant="secondary" />
      {selectedCount >= 2 && (
        <Button
          label={t('coach.routine.group.create', { label: t('coach.routine.group.circuit') })}
          onPress={onConfirm}
          size="sm"
        />
      )}
    </View>
  );
}
const gbs = {
  bar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    backgroundColor: colors.surfaceMuted,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  activeBar: { backgroundColor: colors.primarySoft },
  hint: { fontSize: fontSize.xs, color: colors.textMuted },
  spacer: { flex: 1 },
};

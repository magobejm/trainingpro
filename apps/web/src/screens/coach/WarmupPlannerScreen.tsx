/* eslint-disable max-lines-per-function */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { createBlock } from './RoutinePlanner.helpers';
import type { BlockType, DraftBlock } from './RoutinePlanner.types';
import { s } from './RoutinePlanner.styles';
import { AddBlockSection } from './components/RoutineDayCard/AddBlockSection';
import { RoutineBlockCard } from './components/RoutineBlockCard';
import { ExercisePickerModal } from './components/RoutinePlanner/ExercisePickerModal';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import {
  useCreateWarmupTemplateMutation,
  useDeleteWarmupTemplateMutation,
  useUpdateWarmupTemplateMutation,
  useWarmupTemplatesQuery,
  type UpsertWarmupTemplateInput,
  type WarmupTemplateItemInput,
  type WarmupTemplateView,
} from '../../data/hooks/useWarmupTemplates';

type DraftState = {
  blocks: DraftBlock[];
  name: string;
};

const EMPTY_DRAFT: DraftState = { blocks: [], name: '' };

export function WarmupPlannerScreen(): React.JSX.Element {
  const vm = useWarmupPlannerViewModel();
  return renderWarmupPlanner(vm);
}

function useWarmupPlannerViewModel() {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<null | string>(null);
  const [pickerType, setPickerType] = useState<null | BlockType>(null);
  const [showTypeButtons, setShowTypeButtons] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState('');
  const list = useWarmupTemplatesQuery().data ?? [];
  const createMutation = useCreateWarmupTemplateMutation();
  const updateMutation = useUpdateWarmupTemplateMutation(editingId ?? '');
  const deleteMutation = useDeleteWarmupTemplateMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const orderedBlocks = useMemo(
    () => [...draft.blocks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [draft.blocks],
  );
  return {
    createMutation,
    deleteMutation,
    draft,
    editingId,
    isSaving,
    list,
    orderedBlocks,
    pendingDeleteId,
    pickerType,
    setDraft,
    setEditingId,
    setPendingDeleteId,
    setPickerType,
    setShowTypeButtons,
    showTypeButtons,
    t,
    updateMutation,
  };
}

function renderWarmupPlanner(vm: ReturnType<typeof useWarmupPlannerViewModel>): React.JSX.Element {
  const onSave = createSaveHandler(vm);
  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.title}>{vm.t('coach.warmupPlanner.title')}</Text>
      <View style={s.card}>
        <Text style={s.label}>{vm.t('coach.warmupPlanner.name')}</Text>
        <TextInput
          onChangeText={(value) => vm.setDraft((state) => ({ ...state, name: value }))}
          placeholder={vm.t('coach.warmupPlanner.namePlaceholder')}
          style={s.input}
          value={vm.draft.name}
        />
      </View>

      <View style={s.card}>
        {vm.orderedBlocks.length === 0 ? (
          <Text style={s.emptyDay}>{vm.t('coach.warmupPlanner.emptyGroup')}</Text>
        ) : null}
        {vm.orderedBlocks.map((block, index) => (
          <RoutineBlockCard
            block={block}
            dayIdx={0}
            dayLabels={['']}
            daysCount={1}
            isFirst={index === 0}
            isLast={index === vm.orderedBlocks.length - 1}
            key={block.id}
            onMove={(direction) =>
              vm.setDraft((state) => ({
                ...state,
                blocks: moveBlocks(state.blocks, index, direction),
              }))
            }
            onMoveToDay={() => undefined}
            onRemove={() =>
              vm.setDraft((state) => ({
                ...state,
                blocks: state.blocks.filter((item) => item.id !== block.id),
              }))
            }
            onUpdateField={(field, value) =>
              vm.setDraft((state) => ({
                ...state,
                blocks: state.blocks.map((item) =>
                  item.id === block.id ? { ...item, [field]: value } : item,
                ),
              }))
            }
            readOnly={false}
          />
        ))}
        <AddBlockSection
          isAdding={vm.showTypeButtons}
          onAdd={(type) => {
            vm.setPickerType(type);
            vm.setShowTypeButtons(false);
          }}
          onCancel={() => vm.setShowTypeButtons((value) => !value)}
          t={vm.t}
        />
      </View>

      <Pressable onPress={onSave} style={s.saveBtn}>
        <Text style={s.saveBtnText}>
          {vm.isSaving
            ? vm.t('coach.library.exercises.editModal.saving')
            : vm.t('coach.routine.save')}
        </Text>
      </Pressable>

      <View style={s.card}>
        <Text style={s.label}>{vm.t('coach.warmupPlanner.savedList')}</Text>
        {vm.list.map((template) => (
          <View key={template.id} style={s.templateItem}>
            <View style={{ flex: 1 }}>
              <Text style={s.templateName}>{template.name}</Text>
              <Text style={s.templateMeta}>
                {vm.t('coach.warmupPlanner.blocksCount', { count: template.items.length })}
              </Text>
            </View>
            <View style={s.templateActions}>
              <Pressable
                onPress={() => {
                  vm.setEditingId(template.id);
                  vm.setDraft(fromTemplate(template));
                }}
                style={s.editBtn}
              >
                <Text style={s.editBtnText}>{vm.t('coach.routine.list.edit')}</Text>
              </Pressable>
              <Pressable onPress={() => vm.setPendingDeleteId(template.id)} style={s.deleteBtn}>
                <Text style={s.deleteBtnText}>{vm.t('coach.routine.list.delete')}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <ExercisePickerModal
        blockType={vm.pickerType}
        onCancel={() => vm.setPickerType(null)}
        onSelect={(libraryId, name) => {
          const type = vm.pickerType;
          if (!type) return;
          vm.setDraft((state) => ({
            ...state,
            blocks: [
              ...state.blocks,
              { ...createBlock(type, name), libraryId, sortOrder: state.blocks.length },
            ],
          }));
          vm.setPickerType(null);
        }}
        t={vm.t}
      />

      <ActionConfirmModal
        cancelLabel={vm.t('coach.clients.modal.cancel')}
        confirmLabel={vm.t('coach.library.confirm.button')}
        message={vm.t('coach.routine.delete.confirm')}
        onCancel={() => vm.setPendingDeleteId('')}
        onConfirm={() => {
          const id = vm.pendingDeleteId;
          if (!id) return;
          vm.deleteMutation.mutate(id, { onSuccess: () => vm.setPendingDeleteId('') });
        }}
        title={vm.t('coach.library.confirm.title')}
        visible={Boolean(vm.pendingDeleteId)}
      />
    </ScrollView>
  );
}

function createSaveHandler(vm: ReturnType<typeof useWarmupPlannerViewModel>) {
  return () => {
    if (!vm.draft.name.trim() || vm.draft.blocks.length === 0) {
      return;
    }
    const payload = toPayload(vm.draft);
    const onSuccess = () => {
      vm.setDraft(EMPTY_DRAFT);
      vm.setEditingId(null);
    };
    if (vm.editingId) {
      vm.updateMutation.mutate(payload, { onSuccess });
      return;
    }
    vm.createMutation.mutate(payload, { onSuccess });
  };
}

function fromTemplate(template: WarmupTemplateView): DraftState {
  return {
    blocks: template.items.map((item) => ({
      displayName: item.displayName,
      id: `loaded-${item.sortOrder}-${item.displayName}`,
      libraryId: pickLibraryId(item),
      notes: item.notes ?? undefined,
      repsPlanned: item.repsMax ?? undefined,
      restSeconds: item.restSeconds ?? undefined,
      roundsPlanned: item.roundsPlanned ?? undefined,
      setsPlanned: item.setsPlanned ?? undefined,
      sortOrder: item.sortOrder,
      targetRir: item.targetRir ?? undefined,
      targetRpe: item.targetRpe ?? undefined,
      type: mapTypeFromApi(item.blockType),
      workSeconds: item.workSeconds ?? undefined,
    })),
    name: template.name,
  };
}

function toPayload(draft: DraftState): UpsertWarmupTemplateInput {
  return {
    items: draft.blocks.map((block, index) => mapItem(block, index)),
    name: draft.name,
  };
}

function mapItem(block: DraftBlock, sortOrder: number): WarmupTemplateItemInput {
  return {
    blockType: mapTypeToApi(block.type),
    cardioMethodLibraryId: block.type === 'cardio' ? (block.libraryId ?? null) : null,
    displayName: block.displayName,
    exerciseLibraryId: block.type === 'strength' ? (block.libraryId ?? null) : null,
    metadataJson: null,
    notes: block.notes ?? null,
    plioExerciseLibraryId: block.type === 'plio' ? (block.libraryId ?? null) : null,
    repsMax: block.repsPlanned ?? null,
    repsMin: block.repsPlanned ?? null,
    restSeconds: block.restSeconds ?? null,
    roundsPlanned: block.roundsPlanned ?? null,
    setsPlanned: block.setsPlanned ?? null,
    sortOrder,
    targetRir: block.targetRir ?? null,
    targetRpe: block.targetRpe ?? null,
    warmupExerciseLibraryId: block.type === 'warmup' ? (block.libraryId ?? null) : null,
    workSeconds: block.workSeconds ?? null,
  };
}

function moveBlocks(blocks: DraftBlock[], index: number, direction: -1 | 1): DraftBlock[] {
  const target = index + direction;
  if (target < 0 || target >= blocks.length) {
    return blocks;
  }
  const clone = [...blocks];
  const source = clone[index];
  const destination = clone[target];
  if (!source || !destination) {
    return blocks;
  }
  clone[index] = destination;
  clone[target] = source;
  return clone.map((item, sortOrder) => ({ ...item, sortOrder }));
}

function mapTypeToApi(type: BlockType): 'cardio' | 'mobility' | 'plio' | 'strength' {
  if (type === 'warmup') return 'mobility';
  if (type === 'cardio' || type === 'plio' || type === 'strength') return type;
  return 'strength';
}

function mapTypeFromApi(type: 'cardio' | 'mobility' | 'plio' | 'strength'): BlockType {
  return type === 'mobility' ? 'warmup' : type;
}

function pickLibraryId(item: WarmupTemplateItemInput): string | undefined {
  return (
    item.exerciseLibraryId ??
    item.cardioMethodLibraryId ??
    item.plioExerciseLibraryId ??
    item.warmupExerciseLibraryId ??
    undefined
  );
}

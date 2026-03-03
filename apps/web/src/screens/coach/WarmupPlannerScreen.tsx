/* eslint-disable max-lines-per-function */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SearchBar } from '@trainerpro/ui';
import { createBlock } from './RoutinePlanner.helpers';
import type { BlockType } from './RoutinePlanner.types';
import {
  EMPTY_DRAFT,
  fromTemplate,
  moveBlocks,
  toPayload,
  type DraftState,
} from './WarmupPlannerScreen.helpers';
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
  type WarmupTemplateView,
} from '../../data/hooks/useWarmupTemplates';

export function WarmupPlannerScreen(): React.JSX.Element {
  const vm = useWarmupPlannerViewModel();
  return renderWarmupPlanner(vm);
}

function useWarmupPlannerViewModel() {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<null | string>(null);
  const [isReadOnlyDraft, setIsReadOnlyDraft] = useState(false);
  const [pickerType, setPickerType] = useState<null | BlockType>(null);
  const [showTypeButtons, setShowTypeButtons] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState('');
  const [listQuery, setListQuery] = useState('');
  const list = useWarmupTemplatesQuery().data ?? [];
  const createMutation = useCreateWarmupTemplateMutation();
  const updateMutation = useUpdateWarmupTemplateMutation(editingId ?? '');
  const deleteMutation = useDeleteWarmupTemplateMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const orderedBlocks = useMemo(
    () => [...draft.blocks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [draft.blocks],
  );
  const filteredList = useMemo(() => filterWarmups(list, listQuery), [list, listQuery]);
  return {
    createMutation,
    deleteMutation,
    draft,
    editingId,
    filteredList,
    isReadOnlyDraft,
    isSaving,
    list,
    listQuery,
    orderedBlocks,
    pendingDeleteId,
    pickerType,
    setDraft,
    setEditingId,
    setIsReadOnlyDraft,
    setListQuery,
    setPendingDeleteId,
    setPickerType,
    setShowTypeButtons,
    showTypeButtons,
    t,
    updateMutation,
  };
}

function filterWarmups(list: WarmupTemplateView[], query: string): WarmupTemplateView[] {
  const sorted = [...list].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
  );
  const raw = query.trim().toLowerCase();
  if (!raw) {
    return sorted;
  }
  return sorted.filter((item) => item.name.toLowerCase().includes(raw));
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
          editable={!vm.isReadOnlyDraft}
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
              vm.isReadOnlyDraft
                ? undefined
                : vm.setDraft((state) => ({
                    ...state,
                    blocks: moveBlocks(state.blocks, index, direction),
                  }))
            }
            onMoveToDay={() => undefined}
            onRemove={() =>
              vm.isReadOnlyDraft
                ? undefined
                : vm.setDraft((state) => ({
                    ...state,
                    blocks: state.blocks.filter((item) => item.id !== block.id),
                  }))
            }
            onUpdateField={(field, value) =>
              vm.isReadOnlyDraft
                ? undefined
                : vm.setDraft((state) => ({
                    ...state,
                    blocks: state.blocks.map((item) =>
                      item.id === block.id ? { ...item, [field]: value } : item,
                    ),
                  }))
            }
            readOnly={vm.isReadOnlyDraft}
          />
        ))}
        {vm.isReadOnlyDraft ? null : (
          <AddBlockSection
            isAdding={vm.showTypeButtons}
            onAdd={(type) => {
              vm.setPickerType(type);
              vm.setShowTypeButtons(false);
            }}
            onCancel={() => vm.setShowTypeButtons((value) => !value)}
            t={vm.t}
          />
        )}
      </View>

      {vm.isReadOnlyDraft ? null : (
        <Pressable onPress={onSave} style={s.saveBtn}>
          <Text style={s.saveBtnText}>
            {vm.isSaving
              ? vm.t('coach.library.exercises.editModal.saving')
              : vm.t('coach.warmupPlanner.save')}
          </Text>
        </Pressable>
      )}

      <View style={s.card}>
        <Text style={s.label}>{vm.t('coach.warmupPlanner.savedList')}</Text>
        <SearchBar
          onChangeText={vm.setListQuery}
          placeholder={vm.t('coach.warmupPlanner.searchPlaceholder')}
          value={vm.listQuery}
        />
        {vm.filteredList.map((template) => (
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
                  vm.setEditingId(template.scope === 'GLOBAL' ? null : template.id);
                  vm.setIsReadOnlyDraft(template.scope === 'GLOBAL');
                  vm.setDraft(fromTemplate(template));
                }}
                style={s.editBtn}
              >
                <Text style={s.editBtnText}>
                  {template.scope === 'GLOBAL'
                    ? vm.t('common.view')
                    : vm.t('coach.routine.list.edit')}
                </Text>
              </Pressable>
              {canDeleteTemplate(template) ? (
                <Pressable onPress={() => vm.setPendingDeleteId(template.id)} style={s.deleteBtn}>
                  <Text style={s.deleteBtnText}>{vm.t('coach.routine.list.delete')}</Text>
                </Pressable>
              ) : null}
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
          const template = vm.list.find((item) => item.id === id);
          if (!template || !canDeleteTemplate(template)) {
            vm.setPendingDeleteId('');
            return;
          }
          vm.deleteMutation.mutate(id, { onSuccess: () => vm.setPendingDeleteId('') });
        }}
        title={vm.t('coach.library.confirm.title')}
        visible={Boolean(vm.pendingDeleteId)}
      />
    </ScrollView>
  );
}

function canDeleteTemplate(template: WarmupTemplateView): boolean {
  return template.scope === 'COACH';
}

function createSaveHandler(vm: ReturnType<typeof useWarmupPlannerViewModel>) {
  return () => {
    if (vm.isReadOnlyDraft || !vm.draft.name.trim() || vm.draft.blocks.length === 0) {
      return;
    }
    const payload = toPayload(vm.draft);
    const onSuccess = () => {
      vm.setDraft(EMPTY_DRAFT);
      vm.setEditingId(null);
      vm.setIsReadOnlyDraft(false);
    };
    if (vm.editingId) {
      vm.updateMutation.mutate(payload, { onSuccess });
      return;
    }
    vm.createMutation.mutate(payload, { onSuccess });
  };
}

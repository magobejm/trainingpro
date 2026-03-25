import React, { useRef } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import { DayList } from './DayList';
import { SaveRoutineModal } from './SaveRoutineModal';
import type { DraftDay, DraftState, BlockType, DraftBlock } from '../../RoutinePlanner.types';
import type { RoutineTemplateView } from '../../../../data/hooks/useRoutineTemplates';
import { ROUTINE_LABELS, type PlannerLabels } from './planner-labels';
import { useWarmupTemplatesQuery, type WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';
import { RoutinePlannerModals } from './RoutinePlannerModals';
import { createWarmupTemplateSelector } from './RoutinePlannerLayout.helpers';
import { RoutinePlannerTopSection } from './RoutinePlannerTopSection';
import { NeatSection } from './NeatSection';

interface LayoutProps {
  clientContextId?: null | string;
  clientContextName?: null | string;
  objectiveOptions: Array<{ id: string; label: string }>;
  onAssignTemplate?: (templateId: string) => Promise<void>;
  t: (k: string, options?: Record<string, unknown>) => string;
  uiState: {
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    saveSuccess: boolean;
    setSaveSuccess: (v: boolean) => void;
    deletingId: string | null;
    setDeletingId: (id: string | null) => void;
    addIdx: number | null;
    setAddIdx: (i: number | null) => void;
    pickerType: BlockType | null;
    setPickerType: (t: BlockType | null) => void;
    showWarmupTemplatePicker: boolean;
    setShowWarmupTemplatePicker: (value: boolean) => void;
    showSaveModal: boolean;
    setShowSaveModal: (v: boolean) => void;
  };
  draftState: {
    draft: DraftState;
    setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
    activeDayIdx: number;
    setActiveDayIdx: (i: number) => void;
    addDay: () => void;
    removeDay: (dayIdx: number) => void;
    renameDay: (dayIdx: number, title: string) => void;
    onAddBlock: (dayIdx: number, type: BlockType, libraryId: string, name: string) => void;
    onUpdateBlockField: (dayIdx: number, blockId: string, field: keyof DraftBlock, value: unknown) => void;
    onMoveBlock: (dayIdx: number, blockIdx: number, direction: -1 | 1) => void;
    onMoveBlockToDay: (fromIdx: number, bIdx: number, toIdx: number) => void;
    onRemoveBlock: (dayIdx: number, blockId: string) => void;
    moveDay: (fromIdx: number, dir: -1 | 1) => void;
    updateDay: (dayIdx: number, updated: DraftDay) => void;
    lastAddedBlockId: string | null;
  };
  onSave: (name: string) => Promise<void>;
  onSaveAndAssign: (name: string, clientId: string) => Promise<void>;
  onAssignOnly?: (clientId: string) => Promise<void>;
  templates: RoutineTemplateView[];
  deleteMutation: {
    isPending: boolean;
    mutate: (id: string, opts?: { onSettled?: () => void }) => void;
  };
  labels?: PlannerLabels;
}

type OpenPickerFn = (dayIdx: number, type: BlockType) => void;

function buildDraftHandlers(
  draftState: LayoutProps['draftState'],
  onOpenPicker: OpenPickerFn,
  onOpenWarmupTemplatePicker: (dayIdx: number) => void,
) {
  return {
    onOpenPicker,
    onOpenWarmupTemplatePicker,
    moveDay: draftState.moveDay,
    onMoveBlock: draftState.onMoveBlock,
    onMoveBlockToDay: draftState.onMoveBlockToDay,
    onRemoveBlock: draftState.onRemoveBlock,
    onUpdateBlockField: draftState.onUpdateBlockField,
    removeDay: draftState.removeDay,
    renameDay: draftState.renameDay,
    updateDay: draftState.updateDay,
  };
}

function RoutineMainSection(
  props: LayoutProps & {
    onOpenPicker: OpenPickerFn;
    onOpenWarmupTemplatePicker: (dayIdx: number) => void;
  },
) {
  const { t, draftState, uiState, labels = ROUTINE_LABELS } = props;
  const isReadOnly = draftState.draft.scope === 'GLOBAL';
  return (
    <>
      <RoutineDayList
        addIdx={uiState.addIdx}
        draftState={draftState}
        isReadOnly={isReadOnly}
        labels={labels}
        onOpenPicker={props.onOpenPicker}
        onOpenWarmupTemplatePicker={props.onOpenWarmupTemplatePicker}
        setAddIdx={uiState.setAddIdx}
      />
      {!isReadOnly && (
        <Pressable onPress={draftState.addDay} style={s.addDayBtn}>
          <Text style={s.addDayText}>{`+ ${t(labels.addContainerKey)}`}</Text>
        </Pressable>
      )}
    </>
  );
}

function RoutineDayList(props: {
  addIdx: null | number;
  draftState: LayoutProps['draftState'];
  isReadOnly: boolean;
  labels: PlannerLabels;
  onOpenPicker: OpenPickerFn;
  onOpenWarmupTemplatePicker: (dayIdx: number) => void;
  setAddIdx: (i: number | null) => void;
}) {
  return (
    <DayList
      addIdx={props.addIdx}
      days={props.draftState.draft.days}
      draftState={buildDraftHandlers(props.draftState, props.onOpenPicker, props.onOpenWarmupTemplatePicker)}
      isReadOnly={props.isReadOnly}
      labels={props.labels}
      lastAddedBlockId={props.draftState.lastAddedBlockId}
      setAddIdx={props.setAddIdx}
    />
  );
}

function RoutineFooterSection(props: LayoutProps) {
  const { t, draftState, uiState } = props;
  const isGlobal = draftState.draft.scope === 'GLOBAL';
  return (
    <>
      <Pressable onPress={() => uiState.setShowSaveModal(true)} style={s.saveBtn}>
        <Text style={s.saveBtnText}>{isGlobal ? t('coach.routine.assign') : t('coach.routine.save')}</Text>
      </Pressable>
      <SaveRoutineModal
        initialName={draftState.draft.name}
        isGlobal={isGlobal}
        onAssignOnly={props.onAssignOnly}
        onClose={() => uiState.setShowSaveModal(false)}
        onSave={props.onSave}
        onSaveAndAssign={props.onSaveAndAssign}
        t={t}
        visible={uiState.showSaveModal}
      />
    </>
  );
}

function usePickerHandlers(uiState: LayoutProps['uiState'], draftState: LayoutProps['draftState']) {
  const pendingDayIdxRef = useRef<number>(0);

  function onOpenPicker(dayIdx: number, type: BlockType) {
    pendingDayIdxRef.current = dayIdx;
    uiState.setPickerType(type);
  }

  function onPickerSelect(libraryId: string, displayName: string) {
    draftState.onAddBlock(pendingDayIdxRef.current, uiState.pickerType!, libraryId, displayName);
    uiState.setPickerType(null);
  }

  const onOpenWarmupTemplatePicker = (dayIdx: number) => {
    pendingDayIdxRef.current = dayIdx;
    uiState.setShowWarmupTemplatePicker(true);
  };
  const onSelectWarmupTemplate = createWarmupTemplateSelector(
    draftState.setDraft,
    uiState.setShowWarmupTemplatePicker,
    pendingDayIdxRef,
  );

  return { onOpenPicker, onOpenWarmupTemplatePicker, onPickerSelect, onSelectWarmupTemplate };
}

export function RoutinePlannerLayout(props: LayoutProps) {
  const { uiState, draftState } = props;
  const warmupTemplates = useWarmupTemplatesQuery().data ?? [];
  const { onOpenPicker, onOpenWarmupTemplatePicker, onPickerSelect, onSelectWarmupTemplate } = usePickerHandlers(
    uiState,
    draftState,
  );
  return renderLayout(
    props,
    onOpenPicker,
    onOpenWarmupTemplatePicker,
    onPickerSelect,
    onSelectWarmupTemplate,
    warmupTemplates,
  );
}

function renderLayout(
  props: LayoutProps,
  onOpenPicker: OpenPickerFn,
  onOpenWarmupTemplatePicker: (dayIdx: number) => void,
  onPickerSelect: (libraryId: string, displayName: string) => void,
  onSelectWarmupTemplate: (template: WarmupTemplateView) => void,
  warmupTemplates: WarmupTemplateView[],
) {
  const { uiState, t } = props;
  return (
    <ScrollView contentContainerStyle={s.page}>
      <RoutineLayoutSections
        onOpenPicker={onOpenPicker}
        onOpenWarmupTemplatePicker={onOpenWarmupTemplatePicker}
        props={props}
      />
      <RoutinePlannerModals
        onPickerSelect={onPickerSelect}
        onSelectWarmupTemplate={onSelectWarmupTemplate}
        t={t}
        uiState={uiState}
        warmupTemplates={warmupTemplates}
      />
    </ScrollView>
  );
}

function RoutineLayoutSections(props: {
  onOpenPicker: OpenPickerFn;
  onOpenWarmupTemplatePicker: (dayIdx: number) => void;
  props: LayoutProps;
}) {
  const { draftState, uiState, t, labels = ROUTINE_LABELS } = props.props;
  return (
    <>
      <RoutinePlannerTopSection
        draft={draftState.draft}
        isReadOnly={draftState.draft.scope === 'GLOBAL'}
        labels={labels}
        objectiveOptions={props.props.objectiveOptions}
        saveSuccess={uiState.saveSuccess}
        setDraft={draftState.setDraft}
        t={t}
      />
      <RoutineMainSection
        {...props.props}
        onOpenPicker={props.onOpenPicker}
        onOpenWarmupTemplatePicker={props.onOpenWarmupTemplatePicker}
      />
      <NeatSection
        isReadOnly={draftState.draft.scope === 'GLOBAL'}
        neats={draftState.draft.neats ?? []}
        onChange={(neats) => draftState.setDraft((prev) => ({ ...prev, neats }))}
        t={t}
      />
      <RoutineFooterSection {...props.props} />
    </>
  );
}

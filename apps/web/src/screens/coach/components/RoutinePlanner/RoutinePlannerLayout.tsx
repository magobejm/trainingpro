import React, { useRef } from 'react';
import { ScrollView } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import { DayTabs } from './DayTabs';
import { DayList } from './DayList';
import { SaveButton } from './SaveButton';
import { RoutineList } from './RoutineList';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { mapTemplateToDraft } from '../../RoutinePlanner.helpers';
import type { DraftState, BlockType, DraftBlock } from '../../RoutinePlanner.types';
import type { RoutineTemplateView } from '../../../../data/hooks/useRoutineTemplates';
import { ROUTINE_LABELS, type PlannerLabels } from './planner-labels';
import {
  useWarmupTemplatesQuery,
  type WarmupTemplateView,
} from '../../../../data/hooks/useWarmupTemplates';
import { RoutinePlannerModals } from './RoutinePlannerModals';
import { createWarmupTemplateSelector } from './RoutinePlannerLayout.helpers';
import { RoutinePlannerTopSection } from './RoutinePlannerTopSection';

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
    onUpdateBlockField: (
      dayIdx: number,
      blockId: string,
      field: keyof DraftBlock,
      value: unknown,
    ) => void;
    onMoveBlock: (dayIdx: number, blockIdx: number, direction: -1 | 1) => void;
    onMoveBlockToDay: (fromIdx: number, bIdx: number, toIdx: number) => void;
    onRemoveBlock: (dayIdx: number, blockId: string) => void;
  };
  onSave: () => void;
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
    onMoveBlock: draftState.onMoveBlock,
    onMoveBlockToDay: draftState.onMoveBlockToDay,
    onRemoveBlock: draftState.onRemoveBlock,
    onUpdateBlockField: draftState.onUpdateBlockField,
    removeDay: draftState.removeDay,
    renameDay: draftState.renameDay,
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
      <RoutineTabs draftState={draftState} isReadOnly={isReadOnly} labels={labels} t={t} />
      <RoutineDayList
        addIdx={uiState.addIdx}
        draftState={draftState}
        isReadOnly={isReadOnly}
        labels={labels}
        onOpenPicker={props.onOpenPicker}
        onOpenWarmupTemplatePicker={props.onOpenWarmupTemplatePicker}
        setAddIdx={uiState.setAddIdx}
      />
    </>
  );
}

function RoutineTabs(props: {
  draftState: LayoutProps['draftState'];
  isReadOnly: boolean;
  labels: PlannerLabels;
  t: (k: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <DayTabs
      activeIdx={props.draftState.activeDayIdx}
      addLabelKey={props.labels.addContainerKey}
      days={props.draftState.draft.days}
      onAdd={props.draftState.addDay}
      onSelect={props.draftState.setActiveDayIdx}
      onMoveBlockToDay={props.draftState.onMoveBlockToDay}
      readOnly={props.isReadOnly}
      t={props.t}
    />
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
      activeDayIdx={props.draftState.activeDayIdx}
      addIdx={props.addIdx}
      days={props.draftState.draft.days}
      draftState={buildDraftHandlers(
        props.draftState,
        props.onOpenPicker,
        props.onOpenWarmupTemplatePicker,
      )}
      isReadOnly={props.isReadOnly}
      labels={props.labels}
      setAddIdx={props.setAddIdx}
    />
  );
}

function RoutineFooterSection(props: LayoutProps) {
  const { t, draftState, uiState, templates, deleteMutation } = props;
  const isReadOnly = draftState.draft.scope === 'GLOBAL';
  const onLoadTemplate = buildTemplateLoader(uiState.setEditingId, draftState);
  return (
    <>
      {!isReadOnly && <SaveActionButton props={props} />}
      <RoutineList
        clientContextId={props.clientContextId}
        clientContextName={props.clientContextName}
        onAssignTemplate={props.onAssignTemplate}
        onDelete={uiState.setDeletingId}
        onLoad={onLoadTemplate}
        t={t}
        templates={templates}
      />
      <DeleteConfirmModal
        deletingId={uiState.deletingId}
        mutation={deleteMutation}
        setDeletingId={uiState.setDeletingId}
        t={t}
      />
    </>
  );
}

function SaveActionButton(props: { props: LayoutProps }) {
  const { clientContextName, onSave, t, uiState } = props.props;
  return (
    <SaveButton
      clientContextName={clientContextName}
      isEditing={!!uiState.editingId}
      onSave={onSave}
      t={t}
    />
  );
}

function buildTemplateLoader(
  setEditingId: (id: string | null) => void,
  draftState: LayoutProps['draftState'],
) {
  return (tpl: RoutineTemplateView) => {
    setEditingId(tpl.id);
    draftState.setDraft(mapTemplateToDraft(tpl));
    draftState.setActiveDayIdx(0);
  };
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
  const { onOpenPicker, onOpenWarmupTemplatePicker, onPickerSelect, onSelectWarmupTemplate } =
    usePickerHandlers(uiState, draftState);
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
        name={draftState.draft.name}
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
      <RoutineFooterSection {...props.props} />
    </>
  );
}

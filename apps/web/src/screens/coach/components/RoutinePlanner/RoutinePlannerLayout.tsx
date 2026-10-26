import { ClientPreviewButton } from '../../../../features/client-preview/ClientPreview';
import { RoutineDraftPreview } from '../../../../features/client-preview/RoutineDraftPreview';
import { RoutinePdfButton } from '../../../../features/pdf/PlanPdfButton';
import React, { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ArrowLeft } from 'lucide-react';
import { s } from '../../RoutinePlanner.styles';
import { DayList } from './DayList';
import { SaveRoutineModal } from './SaveRoutineModal';
import type { DraftDay, DraftState, BlockType, DraftBlock } from '../../RoutinePlanner.types';
import type { RoutineTemplateView } from '../../../../data/hooks/useRoutineTemplates';
import { ROUTINE_LABELS, type PlannerLabels } from './planner-labels';
import { useWarmupTemplatesQuery } from '../../../../data/hooks/useWarmupTemplates';
import { RoutinePlannerModals } from './RoutinePlannerModals';
import { createWarmupTemplateSelector, removeWarmupTemplateFromDay } from './RoutinePlannerLayout.helpers';
import { RoutinePlannerTopSection } from './RoutinePlannerTopSection';
import { NeatSection } from './NeatSection';
import { WarmupTemplateDetailModal } from './WarmupTemplateDetailModal';
import { Button, colors } from '@trainerpro/ui';
interface LayoutProps {
  clientContextId?: null | string;
  clientContextName?: null | string;
  objectiveOptions: Array<{ id: string; label: string }>;
  onAssignTemplate?: (templateId: string) => Promise<void>;
  onBack?: () => void;
  backLabelKey?: string;
  t: (k: string, options?: Record<string, unknown>) => string;
  viewOnlyMode?: boolean;
  uiState: {
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    saveSuccess: boolean;
    setSaveSuccess: (v: boolean) => void;
    deletingId: string | null;
    setDeletingId: (id: string | null) => void;
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
  onPrepareAssignment?: (name: string) => Promise<string>;
  onSaveAndAssign: (
    name: string,
    clientId: string,
    options?: import('../../routine-handoff').RoutineAssignOptions,
  ) => Promise<void>;
  saveDisabled?: boolean;
  isDraft?: boolean;
  statusNode?: React.ReactNode;
  onAssignOnly?: (clientId: string, options?: import('../../routine-handoff').RoutineAssignOptions) => Promise<void>;
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
  onRemoveWarmupTemplate: (dayIdx: number, templateId: string) => void,
  onViewWarmupTemplate: (dayIdx: number, templateId: string) => void,
) {
  return {
    onOpenPicker,
    onOpenWarmupTemplatePicker,
    onRemoveWarmupTemplate,
    onViewWarmupTemplate,
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
    onRemoveWarmupTemplate: (dayIdx: number, templateId: string) => void;
    onViewWarmupTemplate: (dayIdx: number, templateId: string) => void;
  },
) {
  const { t, draftState, labels = ROUTINE_LABELS, viewOnlyMode } = props;
  const isReadOnly = viewOnlyMode || draftState.draft.scope === 'GLOBAL';
  return (
    <>
      <RoutineDayList
        draftState={draftState}
        isReadOnly={isReadOnly}
        labels={labels}
        onOpenPicker={props.onOpenPicker}
        onOpenWarmupTemplatePicker={props.onOpenWarmupTemplatePicker}
        onRemoveWarmupTemplate={props.onRemoveWarmupTemplate}
        onViewWarmupTemplate={props.onViewWarmupTemplate}
      />
      {!isReadOnly && (
        <Button
          label={`+ ${t(labels.addContainerKey)}`}
          onPress={draftState.addDay}
          style={s.addDayBtn}
          variant="secondary"
        />
      )}
    </>
  );
}

function RoutineDayList(props: {
  draftState: LayoutProps['draftState'];
  isReadOnly: boolean;
  labels: PlannerLabels;
  onOpenPicker: OpenPickerFn;
  onOpenWarmupTemplatePicker: (dayIdx: number) => void;
  onRemoveWarmupTemplate: (dayIdx: number, templateId: string) => void;
  onViewWarmupTemplate: (dayIdx: number, templateId: string) => void;
}) {
  return (
    <DayList
      days={props.draftState.draft.days}
      draftState={buildDraftHandlers(
        props.draftState,
        props.onOpenPicker,
        props.onOpenWarmupTemplatePicker,
        props.onRemoveWarmupTemplate,
        props.onViewWarmupTemplate,
      )}
      isReadOnly={props.isReadOnly}
      labels={props.labels}
      lastAddedBlockId={props.draftState.lastAddedBlockId}
    />
  );
}

function RoutineFooterSection(props: LayoutProps) {
  const { t, draftState, uiState, viewOnlyMode } = props;
  const isGlobal = draftState.draft.scope === 'GLOBAL';
  const showAssign = viewOnlyMode || isGlobal;
  return (
    <>
      <View style={[s.saveBar, { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }]}>
        <ClientPreviewButton isDraft={Boolean(props.isDraft)} disabled={props.saveDisabled}>
          <RoutineDraftPreview draft={draftState.draft} />
        </ClientPreviewButton>
        <RoutinePdfButton
          draft={draftState.draft}
          isDraft={Boolean(props.isDraft)}
          clientName={props.clientContextName ?? undefined}
          disabled={props.saveDisabled}
        />
        <Button
          disabled={props.saveDisabled}
          label={showAssign ? t('coach.routine.assign') : t('coach.routine.save')}
          onPress={() => uiState.setShowSaveModal(true)}
        />
      </View>
      <SaveRoutineModal
        initialName={draftState.draft.name}
        isGlobal={showAssign}
        onAssignOnly={props.onAssignOnly}
        onClose={() => uiState.setShowSaveModal(false)}
        templateId={uiState.editingId}
        onSave={props.onSave}
        onSaveAndAssign={props.onSaveAndAssign}
        onPrepareAssignment={props.onPrepareAssignment}
        t={t}
        visible={uiState.showSaveModal}
      />
    </>
  );
}

function usePickerHandlers(uiState: LayoutProps['uiState'], draftState: LayoutProps['draftState']) {
  const pendingDayIdxRef = useRef<number>(0);
  const [viewingWarmup, setViewingWarmup] = useState<{ dayIdx: number; templateId: string } | null>(null);

  function onOpenPicker(dayIdx: number, type: BlockType) {
    pendingDayIdxRef.current = dayIdx;
    uiState.setPickerType(type);
  }

  function onPickerSelect(libraryId: string, displayName: string, type: BlockType) {
    draftState.onAddBlock(pendingDayIdxRef.current, type, libraryId, displayName);
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

  const onRemoveWarmupTemplate = (dayIdx: number, templateId: string) => {
    removeWarmupTemplateFromDay(draftState.setDraft, dayIdx, templateId);
  };

  const onViewWarmupTemplate = (dayIdx: number, templateId: string) => {
    setViewingWarmup({ dayIdx, templateId });
  };

  return {
    onOpenPicker,
    onOpenWarmupTemplatePicker,
    onPickerSelect,
    onSelectWarmupTemplate,
    onRemoveWarmupTemplate,
    onViewWarmupTemplate,
    viewingWarmup,
    setViewingWarmup,
  };
}

export function RoutinePlannerLayout(props: LayoutProps) {
  const { uiState, draftState } = props;
  const { data: warmupTemplates = [] } = useWarmupTemplatesQuery();
  const {
    onOpenPicker,
    onOpenWarmupTemplatePicker,
    onPickerSelect,
    onSelectWarmupTemplate,
    onRemoveWarmupTemplate,
    onViewWarmupTemplate,
    viewingWarmup,
    setViewingWarmup,
  } = usePickerHandlers(uiState, draftState);

  const viewingTemplate = viewingWarmup ? (warmupTemplates.find((t) => t.id === viewingWarmup.templateId) ?? null) : null;

  return (
    <View style={s.plannerColumn}>
      <ScrollView contentContainerStyle={s.page} style={s.plannerScroll}>
        <RoutineLayoutSections
          onOpenPicker={onOpenPicker}
          onOpenWarmupTemplatePicker={onOpenWarmupTemplatePicker}
          onRemoveWarmupTemplate={onRemoveWarmupTemplate}
          onViewWarmupTemplate={onViewWarmupTemplate}
          props={props}
        />
        <RoutinePlannerModals
          onPickerSelect={onPickerSelect}
          onSelectWarmupTemplate={onSelectWarmupTemplate}
          t={props.t}
          uiState={uiState}
          warmupTemplates={warmupTemplates}
        />
        <WarmupTemplateDetailModal
          templateId={viewingWarmup?.templateId}
          template={viewingTemplate}
          onClose={() => setViewingWarmup(null)}
          t={props.t}
          visible={viewingWarmup !== null}
        />
      </ScrollView>
      <RoutineFooterSection {...props} />
    </View>
  );
}

function RoutinePlannerBackHeader({
  onBack,
  backLabelKey,
  t,
}: {
  onBack: () => void;
  backLabelKey: string;
  t: LayoutProps['t'];
}) {
  return (
    <View style={plannerBackStyles.row}>
      <Button
        icon={<ArrowLeft color={colors.textMuted} size={18} />}
        label={t(backLabelKey)}
        onPress={onBack}
        size="sm"
        variant="ghost"
      />
    </View>
  );
}

const plannerBackStyles = {
  row: {
    alignItems: 'flex-start' as const,
    marginBottom: 8,
  },
};

function RoutineLayoutSections(props: {
  onOpenPicker: OpenPickerFn;
  onOpenWarmupTemplatePicker: (dayIdx: number) => void;
  onRemoveWarmupTemplate: (dayIdx: number, templateId: string) => void;
  onViewWarmupTemplate: (dayIdx: number, templateId: string) => void;
  props: LayoutProps;
}) {
  const { draftState, uiState, t, labels = ROUTINE_LABELS, viewOnlyMode, onBack, backLabelKey } = props.props;
  const isReadOnly = viewOnlyMode || draftState.draft.scope === 'GLOBAL';
  return (
    <>
      {onBack && backLabelKey ? <RoutinePlannerBackHeader onBack={onBack} backLabelKey={backLabelKey} t={t} /> : null}
      {props.props.statusNode}
      <RoutinePlannerTopSection
        draft={draftState.draft}
        editingId={uiState.editingId}
        isReadOnly={isReadOnly}
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
        onRemoveWarmupTemplate={props.onRemoveWarmupTemplate}
        onViewWarmupTemplate={props.onViewWarmupTemplate}
      />
      <NeatSection
        isReadOnly={isReadOnly}
        neats={draftState.draft.neats ?? []}
        onChange={(neats) => draftState.setDraft((prev) => ({ ...prev, neats }))}
        t={t}
      />
    </>
  );
}

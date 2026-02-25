import React from 'react';
import { ScrollView, Text } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import { SuccessBanner } from './SuccessBanner';
import { ReadOnlyBadge } from './ReadOnlyBadge';
import { RoutineNameInput } from './RoutineNameInput';
import { DayTabs } from './DayTabs';
import { DayList } from './DayList';
import { SaveButton } from './SaveButton';
import { RoutineList } from './RoutineList';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { mapTemplateToDraft } from '../../RoutinePlanner.helpers';
import type { DraftState, BlockType, DraftBlock } from '../../RoutinePlanner.types';
import type { RoutineTemplateView } from '../../../../data/hooks/useRoutineTemplates';

interface LayoutProps {
  t: (k: string, options?: { count: number }) => string;
  uiState: {
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    saveSuccess: boolean;
    setSaveSuccess: (v: boolean) => void;
    deletingId: string | null;
    setDeletingId: (id: string | null) => void;
    addIdx: number | null;
    setAddIdx: (i: number | null) => void;
  };
  draftState: {
    draft: DraftState;
    setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
    activeDayIdx: number;
    setActiveDayIdx: (i: number) => void;
    addDay: () => void;
    removeDay: (dayIdx: number) => void;
    renameDay: (dayIdx: number, title: string) => void;
    onAddBlock: (dayIdx: number, type: BlockType) => void;
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
}

function RoutineTopSection(props: {
  t: (k: string) => string;
  saveSuccess: boolean;
  isReadOnly: boolean;
  name: string;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
}) {
  const { t, saveSuccess, isReadOnly, name, setDraft } = props;
  return (
    <>
      <Text style={s.title}>{t('coach.routine.title')}</Text>
      {saveSuccess && <SuccessBanner t={t} />}
      {isReadOnly && <ReadOnlyBadge t={t} />}
      <RoutineNameInput isReadOnly={isReadOnly} name={name} setDraft={setDraft} t={t} />
    </>
  );
}

function RoutineMainSection(props: LayoutProps) {
  const { t, draftState, uiState } = props;
  const isReadOnly = draftState.draft.scope === 'GLOBAL';
  return (
    <>
      <DayTabs
        activeIdx={draftState.activeDayIdx}
        days={draftState.draft.days}
        onAdd={draftState.addDay}
        onSelect={draftState.setActiveDayIdx}
        readOnly={isReadOnly}
        t={t}
      />
      <DayList
        activeDayIdx={draftState.activeDayIdx}
        addIdx={uiState.addIdx}
        days={draftState.draft.days}
        draftState={draftState}
        isReadOnly={isReadOnly}
        setAddIdx={uiState.setAddIdx}
      />
    </>
  );
}

function RoutineFooterSection(props: LayoutProps) {
  const { t, draftState, uiState, onSave, templates, deleteMutation } = props;
  const isReadOnly = draftState.draft.scope === 'GLOBAL';
  return (
    <>
      {!isReadOnly && <SaveButton isEditing={!!uiState.editingId} onSave={onSave} t={t} />}
      <RoutineList
        onDelete={uiState.setDeletingId}
        onLoad={(tpl) => {
          uiState.setEditingId(tpl.id);
          draftState.setDraft(mapTemplateToDraft(tpl));
          draftState.setActiveDayIdx(0);
        }}
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

export function RoutinePlannerLayout(props: LayoutProps) {
  return (
    <ScrollView contentContainerStyle={s.page}>
      <RoutineTopSection
        isReadOnly={props.draftState.draft.scope === 'GLOBAL'}
        name={props.draftState.draft.name}
        saveSuccess={props.uiState.saveSuccess}
        setDraft={props.draftState.setDraft}
        t={props.t}
      />
      <RoutineMainSection {...props} />
      <RoutineFooterSection {...props} />
    </ScrollView>
  );
}

import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { s } from '../RoutinePlanner.styles';
import type { DraftBlock } from '../RoutinePlanner.types';
import { MoveMenu } from './RoutineBlockCard/MoveMenu';
import { BlockFields } from './RoutineBlockCard/BlockFields';
import { BlockNotes } from './RoutineBlockCard/BlockNotes';
import { BlockHeader } from './RoutineBlockCard/BlockHeader';
import { DetailsToggle } from './RoutineBlockCard/DetailsToggle';
import { BlockDetailModal } from './RoutineBlockCard/BlockDetailModal';

interface RoutineBlockCardProps {
  block: DraftBlock;
  dayIdx: number;
  isFirst: boolean;
  isLast: boolean;
  daysCount: number;
  dayLabels?: string[];
  readOnly?: boolean;
  onUpdateField: (field: keyof DraftBlock, value: unknown) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onMoveToDay: (targetDayIdx: number) => void;
}

export function RoutineBlockCard(props: RoutineBlockCardProps) {
  const { t } = useTranslation();
  const state = useBlockCardState();
  return <RoutineBlockCardView props={props} state={state} t={t} />;
}

function useBlockCardState() {
  const [showMove, setShowMove] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  return {
    showMove,
    setShowMove,
    showDetails,
    setShowDetails,
    showDetailModal,
    setShowDetailModal,
  };
}

function RoutineBlockCardView({
  props,
  state,
  t,
}: {
  props: RoutineBlockCardProps;
  state: ReturnType<typeof useBlockCardState>;
  t: (k: string) => string;
}) {
  return (
    <View style={s.blockCard}>
      <BlockHeaderSection props={props} state={state} />
      <BlockContent
        props={props}
        setShowDetails={state.setShowDetails}
        showDetails={state.showDetails}
        showMove={state.showMove}
        t={t}
      />
      <BlockDetailModal
        block={props.block}
        onClose={() => state.setShowDetailModal(false)}
        visible={state.showDetailModal}
      />
    </View>
  );
}

function BlockHeaderSection({
  props,
  state,
}: {
  props: RoutineBlockCardProps;
  state: ReturnType<typeof useBlockCardState>;
}) {
  return (
    <BlockHeader
      daysCount={props.daysCount}
      displayName={props.block.displayName}
      isFirst={props.isFirst}
      isLast={props.isLast}
      onMove={props.onMove}
      onRemove={props.onRemove}
      onShowMove={() => state.setShowMove(!state.showMove)}
      onShowDetail={() => state.setShowDetailModal(true)}
      onUpdateName={(v) => props.onUpdateField('displayName', v)}
      readOnly={!!props.readOnly}
      type={props.block.type}
    />
  );
}

function MoveSection({
  show,
  props,
  t,
}: {
  show: boolean;
  props: RoutineBlockCardProps;
  t: (k: string) => string;
}) {
  if (!show || props.daysCount <= 1) return null;
  return (
    <MoveMenu
      dayIdx={props.dayIdx}
      daysCount={props.daysCount}
      dayLabels={props.dayLabels}
      onMoveToDay={props.onMoveToDay}
      t={t}
    />
  );
}

function FieldsSection({
  props,
  showDetails,
  setShowDetails,
  t,
}: {
  props: RoutineBlockCardProps;
  showDetails: boolean;
  setShowDetails: (v: boolean) => void;
  t: (k: string) => string;
}) {
  return (
    <View style={s.blockFields}>
      <BlockFields
        block={props.block}
        onUpdateField={props.onUpdateField}
        readOnly={!!props.readOnly}
        t={t}
      />
      <DetailsToggle onToggle={() => setShowDetails(!showDetails)} show={showDetails} t={t} />
    </View>
  );
}

function NotesSection({
  show,
  props,
  t,
}: {
  show: boolean;
  props: RoutineBlockCardProps;
  t: (k: string) => string;
}) {
  if (!show) return null;
  return (
    <BlockNotes
      notes={props.block.notes}
      onUpdate={(v: string) => props.onUpdateField('notes', v)}
      readOnly={!!props.readOnly}
      t={t}
    />
  );
}

function BlockContent({
  props,
  showMove,
  showDetails,
  setShowDetails,
  t,
}: {
  props: RoutineBlockCardProps;
  showMove: boolean;
  showDetails: boolean;
  setShowDetails: (v: boolean) => void;
  t: (k: string) => string;
}) {
  return (
    <>
      <MoveSection props={props} show={showMove} t={t} />
      <FieldsSection
        props={props}
        setShowDetails={setShowDetails}
        showDetails={showDetails}
        t={t}
      />
      <NotesSection props={props} show={showDetails} t={t} />
    </>
  );
}

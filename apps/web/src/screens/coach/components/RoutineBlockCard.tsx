/* eslint-disable max-lines-per-function */
import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { s } from '../RoutinePlanner.styles';
import type { BlockType, DraftBlock } from '../RoutinePlanner.types';
import { MoveMenu } from './RoutineBlockCard/MoveMenu';
import { BlockFields } from './RoutineBlockCard/BlockFields';
import { BlockNotes } from './RoutineBlockCard/BlockNotes';
import { BlockNotesModal } from './RoutineBlockCard/BlockNotesModal';
import { BlockHeader } from './RoutineBlockCard/BlockHeader';
import { BlockDetailModal } from './RoutineBlockCard/BlockDetailModal';
import { resolvePlaceholder } from './RoutinePlanner/ExercisePickerModal.utils';

interface RoutineBlockCardProps {
  block: DraftBlock;
  dayIdx: number;
  isFirst: boolean;
  isLast: boolean;
  isNew?: boolean;
  isGrouped?: boolean;
  daysCount: number;
  dayLabels?: string[];
  readOnly?: boolean;
  onUpdateField: (field: keyof DraftBlock, value: unknown) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onMoveToDay: (targetDayIdx: number) => void;
}

function useBlockCardState(isNew?: boolean) {
  const [showMove, setShowMove] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(!isNew);
  const [isEditing, setIsEditing] = useState(false);
  return {
    showMove,
    setShowMove,
    showDetailModal,
    setShowDetailModal,
    showNotesModal,
    setShowNotesModal,
    isCollapsed,
    setIsCollapsed,
    isEditing,
    setIsEditing,
  };
}

export function RoutineBlockCard(props: RoutineBlockCardProps) {
  const { t } = useTranslation();
  const state = useBlockCardState(props.isNew);
  const fieldsReadOnly = !!props.readOnly || !state.isEditing;
  return (
    <View style={s.blockCard}>
      <BlockHeader
        daysCount={props.daysCount}
        displayName={props.block.displayName}
        importedFromWarmup={props.block.fromWarmupTemplate}
        isCollapsed={state.isCollapsed}
        isEditing={state.isEditing}
        isFirst={props.isFirst}
        isGrouped={props.isGrouped}
        isLast={props.isLast}
        onMove={props.onMove}
        onRemove={props.onRemove}
        onShowMove={() => state.setShowMove(!state.showMove)}
        onShowDetail={() => state.setShowDetailModal(true)}
        onToggleCollapse={() => state.setIsCollapsed((v) => !v)}
        onToggleEdit={() => state.setIsEditing((v) => !v)}
        onUpdateName={(v) => props.onUpdateField('displayName', v)}
        readOnly={!!props.readOnly}
        t={t}
        type={props.block.type}
      />
      {!state.isCollapsed && (
        <>
          {state.showMove && props.daysCount > 1 && (
            <MoveMenu
              dayIdx={props.dayIdx}
              daysCount={props.daysCount}
              dayLabels={props.dayLabels}
              onMoveToDay={props.onMoveToDay}
              t={t}
            />
          )}
          <View style={s.blockBodyRow}>
            <View style={s.blockImageCol}>
              <BlockImage blockType={props.block.type} />
              <BlockNotes onOpenModal={() => state.setShowNotesModal(true)} t={t} />
            </View>
            <View style={s.blockBodyFieldsWrap}>
              <BlockFields block={props.block} onUpdateField={props.onUpdateField} readOnly={fieldsReadOnly} t={t} />
            </View>
          </View>
        </>
      )}
      <BlockDetailModal
        block={props.block}
        onClose={() => state.setShowDetailModal(false)}
        visible={state.showDetailModal}
      />
      <BlockNotesModal
        block={props.block}
        isEditing={state.isEditing}
        onClose={() => state.setShowNotesModal(false)}
        onUpdate={(v) => props.onUpdateField('notes', v)}
        t={t}
        visible={state.showNotesModal}
      />
    </View>
  );
}

const RESIZE_MODE_COVER = 'cover' as const;

function BlockImage({ blockType }: { blockType: BlockType }) {
  return (
    <View style={s.blockImageWrap}>
      <Image resizeMode={RESIZE_MODE_COVER} source={{ uri: resolvePlaceholder(blockType) }} style={s.blockBodyImage} />
    </View>
  );
}

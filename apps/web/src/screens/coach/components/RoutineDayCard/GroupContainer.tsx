import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DraftBlock, DraftExerciseGroup } from '../../RoutinePlanner.types';
import { RoutineBlockCard } from '../RoutineBlockCard';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const PLACEHOLDER_TEXT_COLOR = colors.textMuted;
const ICON_REMOVE_GROUP = '✕';

interface GroupContainerProps {
  group: DraftExerciseGroup;
  blocks: DraftBlock[];
  dayIdx: number;
  daysCount: number;
  dayLabels?: string[];
  readOnly: boolean;
  hideAdvanced?: boolean;
  lastAddedBlockId?: string | null;
  allBlocks: DraftBlock[];
  onMoveBlock: (globalIdx: number, dir: -1 | 1) => void;
  onMoveBlockToDay: (globalIdx: number, target: number) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlockField: (id: string, f: keyof DraftBlock, v: unknown) => void;
  onUpdateGroupNote: (groupId: string, note: string) => void;
  onRemoveGroup: (groupId: string) => void;
}

const GROUP_STYLE: Record<'CIRCUIT' | 'SUPERSET', { color: string; bgColor: string }> = {
  CIRCUIT: { color: colors.primaryHover, bgColor: colors.primaryBorder },
  SUPERSET: { color: '#7c3aed', bgColor: '#ede9fe' },
};

export function GroupContainer({
  group,
  blocks,
  dayIdx,
  daysCount,
  dayLabels,
  readOnly,
  hideAdvanced,
  lastAddedBlockId,
  allBlocks,
  onMoveBlock,
  onMoveBlockToDay,
  onRemoveBlock,
  onUpdateBlockField,
  onUpdateGroupNote,
  onRemoveGroup,
}: GroupContainerProps) {
  const { t } = useTranslation();
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(group.note ?? '');
  const conf = GROUP_STYLE[group.groupType] ?? GROUP_STYLE.CIRCUIT;
  const typeLabel = group.groupType === 'SUPERSET' ? t('coach.routine.group.superset') : t('coach.routine.group.circuit');

  const handleNoteSave = () => {
    onUpdateGroupNote(group.id, noteValue);
    setEditingNote(false);
  };

  return (
    <View style={[st.container, { borderColor: conf.color }]}>
      {/* Group header */}
      <View style={[st.header, { backgroundColor: conf.bgColor }]}>
        <View style={[st.label, { backgroundColor: conf.color }]}>
          <Text style={st.labelText}>{typeLabel}</Text>
        </View>
        <View style={st.noteArea}>
          {editingNote ? (
            <TextInput
              autoFocus
              onBlur={handleNoteSave}
              onChangeText={setNoteValue}
              onSubmitEditing={handleNoteSave}
              placeholder={t('coach.routine.group.notePlaceholder')}
              placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
              style={st.noteInput}
              value={noteValue}
            />
          ) : (
            <TouchableOpacity onPress={() => !readOnly && setEditingNote(true)} style={st.noteTrigger}>
              {group.note ? (
                <Text style={st.noteText} numberOfLines={1}>
                  {group.note}
                </Text>
              ) : !readOnly ? (
                <Text style={st.notePlaceholder}>{t('coach.routine.group.addNoteHint')}</Text>
              ) : null}
            </TouchableOpacity>
          )}
        </View>
        {!readOnly && (
          <TouchableOpacity onPress={() => onRemoveGroup(group.id)} style={st.removeBtn}>
            <Text style={st.removeIcon}>{ICON_REMOVE_GROUP}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Grouped blocks */}
      <View style={st.blocksContainer}>
        {blocks.map((block) => {
          const globalIdx = allBlocks.findIndex((b) => b.id === block.id);
          const isFirst = blocks[0]?.id === block.id;
          const isLast = blocks[blocks.length - 1]?.id === block.id;
          return (
            <div key={block.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <RoutineBlockCard
                block={block}
                dayIdx={dayIdx}
                daysCount={daysCount}
                dayLabels={dayLabels}
                hideAdvanced={hideAdvanced}
                isFirst={isFirst}
                isGrouped
                isLast={isLast}
                isNew={block.id === lastAddedBlockId}
                onMove={(dir) => globalIdx >= 0 && onMoveBlock(globalIdx, dir)}
                onMoveToDay={(target) => globalIdx >= 0 && onMoveBlockToDay(globalIdx, target)}
                onRemove={() => onRemoveBlock(block.id)}
                onUpdateField={(f, v) => onUpdateBlockField(block.id, f, v)}
                readOnly={readOnly}
              />
            </div>
          );
        })}
      </View>
    </View>
  );
}

const st = {
  container: {
    borderWidth: 2,
    borderRadius: radius.md,
    overflow: 'hidden' as const,
    marginVertical: space.xs,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  label: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
  },
  labelText: {
    fontSize: fontSize.xs,
    fontWeight: '700' as const,
    color: colors.surface,
    textTransform: 'uppercase' as const,
  },
  noteArea: { flex: 1 },
  noteTrigger: { paddingVertical: space.xs },
  noteText: { fontSize: fontSize.xs, color: colors.text },
  notePlaceholder: { fontSize: fontSize.xs, color: colors.textMuted },
  noteInput: {
    fontSize: fontSize.xs,
    color: colors.text,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  removeBtn: {
    padding: space.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  removeIcon: { fontSize: fontSize.xs, color: colors.danger },
  blocksContainer: { padding: space.sm, gap: space.sm },
};

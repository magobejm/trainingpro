import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DraftBlock, DraftExerciseGroup } from '../../RoutinePlanner.types';
import { RoutineBlockCard } from '../RoutineBlockCard';

const PLACEHOLDER_TEXT_COLOR = '#94a3b8';
const ICON_REMOVE_GROUP = '✕';

interface GroupContainerProps {
  group: DraftExerciseGroup;
  blocks: DraftBlock[];
  dayIdx: number;
  daysCount: number;
  dayLabels?: string[];
  readOnly: boolean;
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
  CIRCUIT: { color: '#1d4ed8', bgColor: '#dbeafe' },
  SUPERSET: { color: '#7c3aed', bgColor: '#ede9fe' },
};

export function GroupContainer({
  group,
  blocks,
  dayIdx,
  daysCount,
  dayLabels,
  readOnly,
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
    borderRadius: 10,
    overflow: 'hidden' as const,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelText: { fontSize: 11, fontWeight: '700' as const, color: '#fff', textTransform: 'uppercase' as const },
  noteArea: { flex: 1 },
  noteTrigger: { paddingVertical: 4 },
  noteText: { fontSize: 12, color: '#374151' },
  notePlaceholder: { fontSize: 12, color: '#94a3b8' },
  noteInput: {
    fontSize: 12,
    color: '#1e293b',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  removeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  removeIcon: { fontSize: 12, color: '#dc2626' },
  blocksContainer: { padding: 8, gap: 8 },
};

import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { s } from '../RoutinePlanner.styles';
import type { BlockType, DraftBlock, DraftDay } from '../RoutinePlanner.types';
import { DayHeader } from './RoutineDayCard/DayHeader';
import { AddBlockSection } from './RoutineDayCard/AddBlockSection';
import { GroupContainer } from './RoutineDayCard/GroupContainer';
import { RoutineBlockCard } from './RoutineBlockCard';
import type { PlannerLabels } from './RoutinePlanner/planner-labels';
import { useGroupManagement } from '../hooks/useGroupManagement';

interface RoutineDayCardProps {
  day: DraftDay;
  dayIdx: number;
  daysCount: number;
  dayLabels?: string[];
  isFirst: boolean;
  isLast: boolean;
  addBlockDayIdx: number | null;
  readOnly?: boolean;
  onRename: (title: string) => void;
  onRemove: () => void;
  onAddBlock: (type: BlockType) => void;
  onAddWarmupTemplate?: () => void;
  onRemoveWarmupTemplate?: (templateId: string) => void;
  onViewWarmupTemplate?: (templateId: string) => void;
  onSetAddBlockDayIdx: (idx: number | null) => void;
  onUpdateBlockField: (blockId: string, field: keyof DraftBlock, value: unknown) => void;
  onMoveBlock: (blockIdx: number, direction: -1 | 1) => void;
  onRemoveBlock: (blockId: string) => void;
  onMoveBlockToDay: (blockIdx: number, targetDayIdx: number) => void;
  onMoveDay: (direction: -1 | 1) => void;
  onUpdateDay: (updated: DraftDay) => void;
  labels?: PlannerLabels;
  lastAddedBlockId?: string | null;
}

export function RoutineDayCard(props: RoutineDayCardProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { day, readOnly, addBlockDayIdx, dayIdx, daysCount } = props;
  const isAdding = addBlockDayIdx === dayIdx;

  const {
    groupMode,
    selectedBlockIds,
    startGroupMode,
    cancelGroupMode,
    toggleBlockSelection,
    confirmGroup,
    removeGroup,
    updateGroupNote,
  } = useGroupManagement();

  const onAddBlockClick = () => {
    setIsCollapsed(false);
    props.onSetAddBlockDayIdx(isAdding ? null : dayIdx);
  };

  const handleConfirmGroup = () => {
    const updated = confirmGroup(day);
    props.onUpdateDay(updated);
  };

  const handleRemoveGroup = (groupId: string) => {
    const updated = removeGroup(day, groupId);
    props.onUpdateDay(updated);
  };

  const handleUpdateGroupNote = (groupId: string, note: string) => {
    const updated = updateGroupNote(day, groupId, note);
    props.onUpdateDay(updated);
  };

  return (
    <View style={s.dayCardOuter}>
      <DayHeader
        blockCount={day.blocks.length}
        dayNumber={dayIdx + 1}
        daysCount={daysCount}
        isCollapsed={isCollapsed}
        isFirst={props.isFirst}
        isLast={props.isLast}
        onAddBlock={onAddBlockClick}
        onMoveDay={props.onMoveDay}
        onPickWarmup={props.onAddWarmupTemplate}
        onRemove={props.onRemove}
        onRemoveWarmup={props.onRemoveWarmupTemplate}
        onRename={props.onRename}
        onToggleCollapse={() => setIsCollapsed((v) => !v)}
        onViewWarmup={props.onViewWarmupTemplate}
        readOnly={!!readOnly}
        t={t}
        title={day.title}
        warmupTemplates={day.warmupTemplates}
      />
      {/* Group mode bar */}
      {!readOnly && !isCollapsed && (
        <GroupModeBar
          groupMode={groupMode}
          selectedCount={selectedBlockIds.length}
          t={t}
          onStartCircuit={() => startGroupMode('CIRCUIT')}
          onStartSuperset={() => startGroupMode('SUPERSET')}
          onCancel={cancelGroupMode}
          onConfirm={handleConfirmGroup}
        />
      )}
      {!isCollapsed && (
        <View style={s.dayCardBody}>
          <DayBlocksContent
            day={day}
            dayIdx={dayIdx}
            daysCount={daysCount}
            dayLabels={props.dayLabels}
            lastAddedBlockId={props.lastAddedBlockId}
            readOnly={!!readOnly}
            groupMode={groupMode}
            selectedBlockIds={selectedBlockIds}
            t={t}
            onMoveBlock={props.onMoveBlock}
            onMoveBlockToDay={props.onMoveBlockToDay}
            onRemoveBlock={props.onRemoveBlock}
            onUpdateBlockField={props.onUpdateBlockField}
            onToggleBlockSelection={toggleBlockSelection}
            onUpdateGroupNote={handleUpdateGroupNote}
            onRemoveGroup={handleRemoveGroup}
          />
          {!readOnly && isAdding && (
            <AddBlockSection
              isAdding={isAdding}
              onAdd={props.onAddBlock}
              onAddWarmupTemplate={props.onAddWarmupTemplate}
              onCancel={() => props.onSetAddBlockDayIdx(null)}
              t={t}
            />
          )}
        </View>
      )}
    </View>
  );
}

interface GroupModeBarProps {
  groupMode: 'CIRCUIT' | 'SUPERSET' | null;
  selectedCount: number;
  t: TFunction;
  onStartCircuit: () => void;
  onStartSuperset: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function GroupModeBar({
  groupMode,
  selectedCount,
  t,
  onStartCircuit,
  onStartSuperset,
  onCancel,
  onConfirm,
}: GroupModeBarProps) {
  if (!groupMode) {
    return (
      <View style={gbs.bar}>
        <TouchableOpacity onPress={onStartCircuit} style={gbs.circuitBtn}>
          <Text style={gbs.circuitBtnText}>{t('coach.routine.group.addCircuit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onStartSuperset} style={gbs.supersetBtn}>
          <Text style={gbs.supersetBtnText}>{t('coach.routine.group.addSuperset')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const labelKey = groupMode === 'CIRCUIT' ? 'coach.routine.group.circuit' : 'coach.routine.group.superset';
  const label = t(labelKey);
  return (
    <View style={[gbs.bar, gbs.activeBar]}>
      <Text style={gbs.hint}>{t('coach.routine.group.selectHint', { label, count: selectedCount })}</Text>
      <View style={gbs.spacer} />
      <TouchableOpacity onPress={onCancel} style={gbs.cancelBtn}>
        <Text style={gbs.cancelBtnText}>{t('coach.routine.delete.cancel')}</Text>
      </TouchableOpacity>
      {selectedCount >= 2 && (
        <TouchableOpacity onPress={onConfirm} style={gbs.confirmBtn}>
          <Text style={gbs.confirmBtnText}>{t('coach.routine.group.create', { label })}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const gbs = {
  bar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  activeBar: { backgroundColor: '#eff6ff' },
  circuitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93c5fd',
    backgroundColor: '#dbeafe',
  },
  circuitBtnText: { fontSize: 11, fontWeight: '600' as const, color: '#1d4ed8' },
  supersetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c4b5fd',
    backgroundColor: '#ede9fe',
  },
  supersetBtnText: { fontSize: 11, fontWeight: '600' as const, color: '#7c3aed' },
  hint: { fontSize: 12, color: '#475569' },
  spacer: { flex: 1 },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#f1f5f9' },
  cancelBtnText: { fontSize: 11, color: '#64748b' },
  confirmBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: '#3b82f6' },
  confirmBtnText: { fontSize: 11, fontWeight: '700' as const, color: '#fff' },
};

interface DayBlocksContentProps {
  day: DraftDay;
  dayIdx: number;
  daysCount: number;
  dayLabels?: string[];
  lastAddedBlockId?: string | null;
  readOnly: boolean;
  groupMode: 'CIRCUIT' | 'SUPERSET' | null;
  selectedBlockIds: string[];
  t: TFunction;
  onMoveBlock: (idx: number, dir: -1 | 1) => void;
  onMoveBlockToDay: (idx: number, target: number) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlockField: (id: string, f: keyof DraftBlock, v: unknown) => void;
  onToggleBlockSelection: (blockId: string) => void;
  onUpdateGroupNote: (groupId: string, note: string) => void;
  onRemoveGroup: (groupId: string) => void;
}

function DayBlocksContent(props: DayBlocksContentProps) {
  const { day, readOnly, t } = props;
  if (day.blocks.length === 0) {
    return <Text style={s.emptyDay}>{t('coach.routine.day.noExercises')}</Text>;
  }

  const groups = day.groups ?? [];
  const groupedBlockIds = new Set(day.blocks.filter((b) => b.groupId).map((b) => b.groupId!));

  const renderElements: React.ReactNode[] = [];
  const renderedGroupIds = new Set<string>();

  day.blocks.forEach((block, idx) => {
    if (block.groupId && !renderedGroupIds.has(block.groupId)) {
      const group = groups.find((g) => g.id === block.groupId);
      if (group) {
        renderedGroupIds.add(group.id);
        const groupBlocks = day.blocks.filter((b) => b.groupId === group.id);
        renderElements.push(
          <GroupContainer
            key={`group-${group.id}`}
            group={group}
            blocks={groupBlocks}
            dayIdx={props.dayIdx}
            daysCount={props.daysCount}
            dayLabels={props.dayLabels}
            readOnly={readOnly}
            lastAddedBlockId={props.lastAddedBlockId}
            allBlocks={day.blocks}
            onMoveBlock={props.onMoveBlock}
            onMoveBlockToDay={props.onMoveBlockToDay}
            onRemoveBlock={props.onRemoveBlock}
            onUpdateBlockField={props.onUpdateBlockField}
            onUpdateGroupNote={props.onUpdateGroupNote}
            onRemoveGroup={props.onRemoveGroup}
          />,
        );
        return;
      }
    }

    if (block.groupId) return; // already rendered inside group container

    const isInGroupMode = !!props.groupMode;
    const isSelected = props.selectedBlockIds.includes(block.id);
    const isGrouped = groupedBlockIds.has(block.id);

    renderElements.push(
      <div
        key={block.id}
        draggable={!readOnly && !isInGroupMode}
        onDragStart={createDragStart(props.dayIdx, idx)}
        onDragOver={onDragOver}
        onDrop={createDropHandler(props, idx)}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          borderRadius: 10,
        }}
      >
        {isInGroupMode && !isGrouped && (
          <SelectionOverlay selected={isSelected} onPress={() => props.onToggleBlockSelection(block.id)} />
        )}
        <RoutineBlockCard
          block={block}
          dayIdx={props.dayIdx}
          daysCount={props.daysCount}
          dayLabels={props.dayLabels}
          isFirst={idx === 0}
          isLast={idx === day.blocks.length - 1}
          isNew={block.id === props.lastAddedBlockId}
          onMove={(dir) => props.onMoveBlock(idx, dir)}
          onMoveToDay={(target) => props.onMoveBlockToDay(idx, target)}
          onRemove={() => props.onRemoveBlock(block.id)}
          onUpdateField={(f, v) => props.onUpdateBlockField(block.id, f, v)}
          readOnly={readOnly || isInGroupMode}
        />
      </div>,
    );
  });

  return <>{renderElements}</>;
}

function SelectionOverlay({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        backgroundColor: selected ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.02)',
        borderRadius: 10,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#3b82f6' : '#93c5fd',
        borderStyle: selected ? 'solid' : 'dashed',
      }}
    />
  );
}

function createDragStart(dayIdx: number, blockIdx: number) {
  return (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.dataTransfer.setData('application/json', JSON.stringify({ blockIdx, dayIdx }));
    event.dataTransfer.effectAllowed = 'move';
  };
}

function onDragOver(event: React.DragEvent<HTMLDivElement>) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function createDropHandler(props: DayBlocksContentProps, targetIdx: number) {
  return (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (props.readOnly) return;
    const source = parseDragSource(event.dataTransfer.getData('application/json'));
    if (!source || source.dayIdx !== props.dayIdx || source.blockIdx === targetIdx) return;
    event.stopPropagation();
    moveWithinDay(props, source.blockIdx, targetIdx);
  };
}

function parseDragSource(raw: string): null | { blockIdx: number; dayIdx: number } {
  try {
    const value = JSON.parse(raw) as { blockIdx?: unknown; dayIdx?: unknown };
    if (typeof value.blockIdx !== 'number' || typeof value.dayIdx !== 'number') return null;
    return { blockIdx: value.blockIdx, dayIdx: value.dayIdx };
  } catch {
    return null;
  }
}

function moveWithinDay(props: DayBlocksContentProps, from: number, to: number) {
  if (from < to) {
    for (let idx = from; idx < to; idx += 1) {
      props.onMoveBlock(idx, 1);
    }
    return;
  }
  for (let idx = from; idx > to; idx -= 1) {
    props.onMoveBlock(idx, -1);
  }
}

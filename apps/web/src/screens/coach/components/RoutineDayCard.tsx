import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { s } from '../RoutinePlanner.styles';
import type { BlockType, DraftBlock, DraftDay } from '../RoutinePlanner.types';
import { DayHeader } from './RoutineDayCard/DayHeader';
import { AddBlockSection } from './RoutineDayCard/AddBlockSection';
import { BlockList } from './RoutineDayCard/BlockList';
import type { PlannerLabels } from './RoutinePlanner/planner-labels';

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
  onSetAddBlockDayIdx: (idx: number | null) => void;
  onUpdateBlockField: (blockId: string, field: keyof DraftBlock, value: unknown) => void;
  onMoveBlock: (blockIdx: number, direction: -1 | 1) => void;
  onRemoveBlock: (blockId: string) => void;
  onMoveBlockToDay: (blockIdx: number, targetDayIdx: number) => void;
  onMoveDay: (direction: -1 | 1) => void;
  labels?: PlannerLabels;
  lastAddedBlockId?: string | null;
}

export function RoutineDayCard(props: RoutineDayCardProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { day, readOnly, addBlockDayIdx, dayIdx, daysCount } = props;
  const isAdding = addBlockDayIdx === dayIdx;

  const onAddBlockClick = () => {
    setIsCollapsed(false);
    props.onSetAddBlockDayIdx(isAdding ? null : dayIdx);
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
        onRemove={props.onRemove}
        onRename={props.onRename}
        onToggleCollapse={() => setIsCollapsed((v) => !v)}
        readOnly={!!readOnly}
        t={t}
        title={day.title}
      />
      {!isCollapsed && (
        <View style={s.dayCardBody}>
          <DayBlocksContent props={props} t={t} />
          {!readOnly && (
            <AddBlockSection
              isAdding={isAdding}
              onAdd={props.onAddBlock}
              onAddWarmupTemplate={props.onAddWarmupTemplate}
              onCancel={() => props.onSetAddBlockDayIdx(isAdding ? null : dayIdx)}
              t={t}
            />
          )}
        </View>
      )}
    </View>
  );
}

function DayBlocksContent({ props, t }: { props: RoutineDayCardProps; t: (k: string) => string }) {
  const { day, readOnly, dayIdx, daysCount, dayLabels, lastAddedBlockId } = props;
  if (day.blocks.length === 0) {
    return <Text style={s.emptyDay}>{t(props.labels?.emptyContainerKey ?? 'coach.routine.emptyDay')}</Text>;
  }
  return (
    <BlockList
      blocks={day.blocks}
      dayIdx={dayIdx}
      daysCount={daysCount}
      dayLabels={dayLabels}
      lastAddedBlockId={lastAddedBlockId}
      onMoveBlock={props.onMoveBlock}
      onMoveBlockToDay={props.onMoveBlockToDay}
      onRemoveBlock={props.onRemoveBlock}
      onUpdateBlockField={props.onUpdateBlockField}
      readOnly={!!readOnly}
    />
  );
}

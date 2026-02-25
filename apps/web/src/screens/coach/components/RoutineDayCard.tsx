import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { s } from '../RoutinePlanner.styles';
import type { BlockType, DraftBlock, DraftDay } from '../RoutinePlanner.types';
import { DayHeader } from './RoutineDayCard/DayHeader';
import { AddBlockSection } from './RoutineDayCard/AddBlockSection';
import { BlockList } from './RoutineDayCard/BlockList';

interface RoutineDayCardProps {
  day: DraftDay;
  dayIdx: number;
  daysCount: number;
  dayLabels?: string[];
  activeDayIdx: number;
  addBlockDayIdx: number | null;
  readOnly?: boolean;
  onRename: (title: string) => void;
  onRemove: () => void;
  onAddBlock: (type: BlockType) => void;
  onSetAddBlockDayIdx: (idx: number | null) => void;
  onUpdateBlockField: (blockId: string, field: keyof DraftBlock, value: unknown) => void;
  onMoveBlock: (blockIdx: number, direction: -1 | 1) => void;
  onRemoveBlock: (blockId: string) => void;
  onMoveBlockToDay: (blockIdx: number, targetDayIdx: number) => void;
}

export function RoutineDayCard(props: RoutineDayCardProps) {
  const { t } = useTranslation();
  if (props.dayIdx !== props.activeDayIdx) return null;

  const { day, readOnly, addBlockDayIdx, dayIdx } = props;
  const isAdding = addBlockDayIdx === dayIdx;

  return (
    <View style={s.card}>
      <DayHeader
        daysCount={props.daysCount}
        onRemove={props.onRemove}
        onRename={props.onRename}
        readOnly={!!readOnly}
        t={t}
        title={day.title}
      />
      <DayBlocksContent props={props} t={t} />
      {!readOnly && (
        <AddBlockSection
          isAdding={isAdding}
          onAdd={props.onAddBlock}
          onCancel={() => props.onSetAddBlockDayIdx(isAdding ? null : dayIdx)}
          t={t}
        />
      )}
    </View>
  );
}

function DayBlocksContent({ props, t }: { props: RoutineDayCardProps; t: (k: string) => string }) {
  const { day, readOnly, dayIdx, daysCount, dayLabels } = props;
  if (day.blocks.length === 0) {
    return <Text style={s.emptyDay}>{t('coach.routine.emptyDay')}</Text>;
  }
  return (
    <BlockList
      blocks={day.blocks}
      dayIdx={dayIdx}
      daysCount={daysCount}
      dayLabels={dayLabels}
      onMoveBlock={props.onMoveBlock}
      onMoveBlockToDay={props.onMoveBlockToDay}
      onRemoveBlock={props.onRemoveBlock}
      onUpdateBlockField={props.onUpdateBlockField}
      readOnly={!!readOnly}
    />
  );
}

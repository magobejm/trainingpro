import React from 'react';
import type { DraftDay, BlockType, DraftBlock } from '../../RoutinePlanner.types';
import { RoutineDayCard } from '../RoutineDayCard';

export interface DraftStateHandlers {
  onAddBlock: (dayIdx: number, type: BlockType) => void;
  onMoveBlock: (dayIdx: number, blockIdx: number, dir: -1 | 1) => void;
  onMoveBlockToDay: (fromIdx: number, bIdx: number, toIdx: number) => void;
  removeDay: (dayIdx: number) => void;
  onRemoveBlock: (dayIdx: number, blockId: string) => void;
  renameDay: (dayIdx: number, title: string) => void;
  onUpdateBlockField: (dayIdx: number, blockId: string, f: keyof DraftBlock, v: unknown) => void;
}

interface DayListProps {
  days: DraftDay[];
  activeDayIdx: number;
  addIdx: number | null;
  setAddIdx: (i: number | null) => void;
  draftState: DraftStateHandlers;
  isReadOnly: boolean;
}

export function DayList(props: DayListProps) {
  const { days, activeDayIdx, addIdx, setAddIdx, draftState, isReadOnly } = props;
  return (
    <>
      {days.map((day, idx) => (
        <DayListItem
          activeDayIdx={activeDayIdx}
          addIdx={addIdx}
          day={day}
          daysCount={days.length}
          draftState={draftState}
          idx={idx}
          isReadOnly={isReadOnly}
          key={day.id}
          setAddIdx={setAddIdx}
        />
      ))}
    </>
  );
}

interface ItemProps {
  day: DraftDay;
  idx: number;
  activeDayIdx: number;
  addIdx: number | null;
  daysCount: number;
  draftState: DraftStateHandlers;
  isReadOnly: boolean;
  setAddIdx: (i: number | null) => void;
}

function DayListItem(props: ItemProps) {
  const { day, idx, activeDayIdx, addIdx, daysCount, draftState, isReadOnly, setAddIdx } = props;
  return (
    <RoutineDayCard
      activeDayIdx={activeDayIdx}
      addBlockDayIdx={addIdx}
      day={day}
      dayIdx={idx}
      daysCount={daysCount}
      onAddBlock={(type) => {
        draftState.onAddBlock(idx, type);
        setAddIdx(null);
      }}
      onMoveBlock={(bIdx, dir) => draftState.onMoveBlock(idx, bIdx, dir)}
      onMoveBlockToDay={(bIdx, target) => draftState.onMoveBlockToDay(idx, bIdx, target)}
      onRemove={() => draftState.removeDay(idx)}
      onRemoveBlock={(blockId) => draftState.onRemoveBlock(idx, blockId)}
      onRename={(title) => draftState.renameDay(idx, title)}
      onSetAddBlockDayIdx={setAddIdx}
      onUpdateBlockField={(bid, f, v) => draftState.onUpdateBlockField(idx, bid, f, v)}
      readOnly={isReadOnly}
    />
  );
}

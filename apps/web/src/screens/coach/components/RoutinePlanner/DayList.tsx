import React from 'react';
import type { DraftDay, BlockType, DraftBlock } from '../../RoutinePlanner.types';
import { RoutineDayCard } from '../RoutineDayCard';

export interface DraftStateHandlers {
  onOpenPicker: (dayIdx: number, type: BlockType) => void;
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
  const dayLabels = days.map((day) => day.title);
  return (
    <>
      {days.map((day, idx) => (
        <DayListItem
          activeDayIdx={activeDayIdx}
          addIdx={addIdx}
          day={day}
          dayLabels={dayLabels}
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
  dayLabels: string[];
  draftState: DraftStateHandlers;
  isReadOnly: boolean;
  setAddIdx: (i: number | null) => void;
}

const DayListItem = (p: ItemProps) => (
  <RoutineDayCard
    activeDayIdx={p.activeDayIdx}
    addBlockDayIdx={p.addIdx}
    day={p.day}
    dayIdx={p.idx}
    dayLabels={p.dayLabels}
    daysCount={p.daysCount}
    onAddBlock={(type) => {
      p.draftState.onOpenPicker(p.idx, type);
      p.setAddIdx(null);
    }}
    onMoveBlock={(bIdx, dir) => p.draftState.onMoveBlock(p.idx, bIdx, dir)}
    onMoveBlockToDay={(bIdx, target) => p.draftState.onMoveBlockToDay(p.idx, bIdx, target)}
    onRemove={() => p.draftState.removeDay(p.idx)}
    onRemoveBlock={(blockId) => p.draftState.onRemoveBlock(p.idx, blockId)}
    onRename={(title) => p.draftState.renameDay(p.idx, title)}
    onSetAddBlockDayIdx={p.setAddIdx}
    onUpdateBlockField={(bid, f, v) => p.draftState.onUpdateBlockField(p.idx, bid, f, v)}
    readOnly={p.isReadOnly}
  />
);

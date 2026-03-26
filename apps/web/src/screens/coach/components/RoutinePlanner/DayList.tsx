import React from 'react';
import type { DraftDay, BlockType, DraftBlock } from '../../RoutinePlanner.types';
import { RoutineDayCard } from '../RoutineDayCard';
import type { PlannerLabels } from './planner-labels';

export interface DraftStateHandlers {
  onOpenPicker: (dayIdx: number, type: BlockType) => void;
  onOpenWarmupTemplatePicker?: (dayIdx: number) => void;
  onMoveBlock: (dayIdx: number, blockIdx: number, dir: -1 | 1) => void;
  onMoveBlockToDay: (fromIdx: number, bIdx: number, toIdx: number) => void;
  removeDay: (dayIdx: number) => void;
  onRemoveBlock: (dayIdx: number, blockId: string) => void;
  renameDay: (dayIdx: number, title: string) => void;
  onUpdateBlockField: (dayIdx: number, blockId: string, f: keyof DraftBlock, v: unknown) => void;
  moveDay: (fromIdx: number, dir: -1 | 1) => void;
  updateDay: (dayIdx: number, updated: DraftDay) => void;
}

interface DayListProps {
  days: DraftDay[];
  addIdx: number | null;
  setAddIdx: (i: number | null) => void;
  draftState: DraftStateHandlers;
  isReadOnly: boolean;
  labels?: PlannerLabels;
  lastAddedBlockId?: string | null;
}

const DAY_DRAG_KEY = 'application/day-index';

function moveDayToIndex(moveDay: DraftStateHandlers['moveDay'], from: number, to: number) {
  if (from === to) return;
  const dir = from < to ? 1 : -1;
  let idx = from;
  while (idx !== to) {
    moveDay(idx, dir);
    idx += dir;
  }
}

export function DayList(props: DayListProps) {
  const { days, addIdx, setAddIdx, draftState, isReadOnly, labels, lastAddedBlockId } = props;
  const dayLabels = days.map((day) => day.title);

  const handleDayDrop = (targetIdx: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isReadOnly) return;
    const raw = event.dataTransfer.getData(DAY_DRAG_KEY);
    const fromIdx = raw !== '' ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(fromIdx) || fromIdx === targetIdx) return;
    moveDayToIndex(draftState.moveDay, fromIdx, targetIdx);
  };

  return (
    <>
      {days.map((day, idx) => (
        <div
          key={day.id}
          draggable={!isReadOnly}
          onDragStart={(e) => {
            e.dataTransfer.setData(DAY_DRAG_KEY, String(idx));
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={handleDayDrop(idx)}
          style={{ cursor: isReadOnly ? undefined : 'grab' }}
        >
          <RoutineDayCard
            addBlockDayIdx={addIdx}
            day={day}
            dayIdx={idx}
            dayLabels={dayLabels}
            daysCount={days.length}
            isFirst={idx === 0}
            isLast={idx === days.length - 1}
            lastAddedBlockId={lastAddedBlockId}
            onAddBlock={(type) => {
              draftState.onOpenPicker(idx, type);
              setAddIdx(null);
            }}
            onAddWarmupTemplate={() => {
              draftState.onOpenWarmupTemplatePicker?.(idx);
              setAddIdx(null);
            }}
            onMoveBlock={(bIdx, dir) => draftState.onMoveBlock(idx, bIdx, dir)}
            onMoveBlockToDay={(bIdx, target) => draftState.onMoveBlockToDay(idx, bIdx, target)}
            onMoveDay={(dir) => draftState.moveDay(idx, dir)}
            onRemove={() => draftState.removeDay(idx)}
            onRemoveBlock={(blockId) => draftState.onRemoveBlock(idx, blockId)}
            onRename={(title) => draftState.renameDay(idx, title)}
            onSetAddBlockDayIdx={setAddIdx}
            onUpdateBlockField={(bid, f, v) => draftState.onUpdateBlockField(idx, bid, f, v)}
            onUpdateDay={(updated) => draftState.updateDay(idx, updated)}
            readOnly={isReadOnly}
            labels={labels}
          />
        </div>
      ))}
    </>
  );
}

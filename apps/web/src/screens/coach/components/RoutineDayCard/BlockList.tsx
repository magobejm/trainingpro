import React from 'react';
import type { DraftBlock } from '../../RoutinePlanner.types';
import { RoutineBlockCard } from '../RoutineBlockCard';

interface BlockListProps {
  blocks: DraftBlock[];
  dayIdx: number;
  daysCount: number;
  readOnly: boolean;
  onMoveBlock: (idx: number, dir: -1 | 1) => void;
  onMoveBlockToDay: (idx: number, target: number) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlockField: (id: string, f: keyof DraftBlock, v: unknown) => void;
}

export function BlockList({
  blocks,
  dayIdx,
  daysCount,
  readOnly,
  onMoveBlock,
  onMoveBlockToDay,
  onRemoveBlock,
  onUpdateBlockField,
}: BlockListProps) {
  return (
    <>
      {blocks.map((block, bIdx) => (
        <RoutineBlockCard
          key={block.id}
          block={block}
          dayIdx={dayIdx}
          daysCount={daysCount}
          isFirst={bIdx === 0}
          isLast={bIdx === blocks.length - 1}
          onMove={(dir) => onMoveBlock(bIdx, dir)}
          onMoveToDay={(target) => onMoveBlockToDay(bIdx, target)}
          onRemove={() => onRemoveBlock(block.id)}
          onUpdateField={(f, v) => onUpdateBlockField(block.id, f, v)}
          readOnly={readOnly}
        />
      ))}
    </>
  );
}

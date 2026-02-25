import React from 'react';
import type { DraftBlock } from '../../RoutinePlanner.types';
import { RoutineBlockCard } from '../RoutineBlockCard';

interface BlockListProps {
  blocks: DraftBlock[];
  dayIdx: number;
  daysCount: number;
  dayLabels?: string[];
  readOnly: boolean;
  onMoveBlock: (idx: number, dir: -1 | 1) => void;
  onMoveBlockToDay: (idx: number, target: number) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlockField: (id: string, f: keyof DraftBlock, v: unknown) => void;
}

export const BlockList = (props: BlockListProps) => (
  <>
    {props.blocks.map((block, bIdx) => (
      <RoutineBlockCard
        key={block.id}
        block={block}
        dayIdx={props.dayIdx}
        daysCount={props.daysCount}
        dayLabels={props.dayLabels}
        isFirst={bIdx === 0}
        isLast={bIdx === props.blocks.length - 1}
        onMove={(dir) => props.onMoveBlock(bIdx, dir)}
        onMoveToDay={(target) => props.onMoveBlockToDay(bIdx, target)}
        onRemove={() => props.onRemoveBlock(block.id)}
        onUpdateField={(f, v) => props.onUpdateBlockField(block.id, f, v)}
        readOnly={props.readOnly}
      />
    ))}
  </>
);

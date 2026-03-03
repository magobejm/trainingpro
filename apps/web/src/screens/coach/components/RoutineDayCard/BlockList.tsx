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
      <div
        key={block.id}
        draggable={!props.readOnly}
        onDragStart={createDragStart(props.dayIdx, bIdx)}
        onDragOver={onDragOver}
        onDrop={createDropHandler(props, bIdx)}
        style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
      >
        <RoutineBlockCard
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
      </div>
    ))}
  </>
);

function createDragStart(dayIdx: number, blockIdx: number) {
  return (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ blockIdx, dayIdx }));
    event.dataTransfer.effectAllowed = 'move';
  };
}

function onDragOver(event: React.DragEvent<HTMLDivElement>) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function createDropHandler(props: BlockListProps, targetIdx: number) {
  return (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (props.readOnly) return;
    const source = parseDragSource(event.dataTransfer.getData('application/json'));
    if (!source || source.dayIdx !== props.dayIdx || source.blockIdx === targetIdx) return;
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

function moveWithinDay(props: BlockListProps, from: number, to: number) {
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

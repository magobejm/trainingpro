import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';

interface DayTabsProps {
  days: { id: string; title: string }[];
  activeIdx: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onMoveBlockToDay?: (fromDayIdx: number, blockIdx: number, toDayIdx: number) => void;
  readOnly: boolean;
  t: (k: string) => string;
  addLabelKey?: string;
}

export function DayTabs({
  days,
  activeIdx,
  onSelect,
  onAdd,
  onMoveBlockToDay,
  readOnly,
  t,
  addLabelKey = 'coach.routine.addDay',
}: DayTabsProps) {
  return (
    <View style={s.dayTabRow}>
      {days.map((day, idx) => (
        <DayTabDropTarget
          active={idx === activeIdx}
          day={day}
          index={idx}
          onMoveBlockToDay={onMoveBlockToDay}
          onSelect={onSelect}
          readOnly={readOnly}
        />
      ))}
      {!readOnly && (
        <Pressable onPress={onAdd} style={s.addDayBtn}>
          <Text style={s.addDayText}>{`+ ${t(addLabelKey)}`}</Text>
        </Pressable>
      )}
    </View>
  );
}

function DayTabDropTarget(props: {
  active: boolean;
  day: { id: string; title: string };
  index: number;
  onMoveBlockToDay?: (fromDayIdx: number, blockIdx: number, toDayIdx: number) => void;
  onSelect: (index: number) => void;
  readOnly: boolean;
}) {
  return (
    <div
      key={props.day.id}
      onDragOver={onDragOverDayTab}
      onDrop={createDropToDay(props.onMoveBlockToDay, props.readOnly, props.index)}
      style={{ display: 'flex' }}
    >
      <Pressable
        onPress={() => props.onSelect(props.index)}
        style={[s.dayTab, props.active && s.dayTabActive]}
      >
        <Text style={[s.dayTabText, props.active && s.dayTabTextActive]}>{props.day.title}</Text>
      </Pressable>
    </div>
  );
}

function onDragOverDayTab(event: React.DragEvent<HTMLDivElement>) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function createDropToDay(
  onMoveBlockToDay: DayTabsProps['onMoveBlockToDay'],
  readOnly: boolean,
  targetDayIdx: number,
) {
  return (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (readOnly || !onMoveBlockToDay) return;
    const source = parseDropSource(event.dataTransfer.getData('application/json'));
    if (!source || source.dayIdx === targetDayIdx) return;
    onMoveBlockToDay(source.dayIdx, source.blockIdx, targetDayIdx);
  };
}

function parseDropSource(raw: string): null | { blockIdx: number; dayIdx: number } {
  try {
    const value = JSON.parse(raw) as { blockIdx?: unknown; dayIdx?: unknown };
    if (typeof value.blockIdx !== 'number' || typeof value.dayIdx !== 'number') return null;
    return { blockIdx: value.blockIdx, dayIdx: value.dayIdx };
  } catch {
    return null;
  }
}

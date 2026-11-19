import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fontSize, radius } from '@trainerpro/ui';

const DRAG_MIME = 'application/x-trainerpro-item';
const HANDLE = '⠿';

type DragPayload = { dayId: string; index: number };

const handleStyle: React.CSSProperties = {
  alignItems: 'center',
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  cursor: 'grab',
  display: 'flex',
  height: 28,
  justifyContent: 'center',
  touchAction: 'none',
  userSelect: 'none',
  width: 28,
};

export function DragHandle(props: DragPayload & { label: string; onDragEnd: () => void }): React.JSX.Element {
  return (
    <div
      aria-label={props.label}
      draggable
      onDragEnd={props.onDragEnd}
      onDragStart={(event) => startDrag(event, props)}
      style={handleStyle}
      title={props.label}
    >
      <Text style={styles.glyph}>{HANDLE}</Text>
    </div>
  );
}

export function DropSlot(props: {
  active: boolean;
  children: React.ReactNode;
  dayId: string;
  editable: boolean;
  index: number;
  onDrop: (from: number) => void;
  onOver: (index: number) => void;
}): React.JSX.Element {
  if (!props.editable) return <>{props.children}</>;
  return (
    <div
      onDragEnter={() => props.onOver(props.index)}
      onDragOver={allowDrop}
      onDrop={(event) => dropOn(event, props)}
      style={slotStyle(props.active)}
    >
      {props.children}
    </div>
  );
}

function startDrag(event: React.DragEvent<HTMLDivElement>, source: DragPayload) {
  event.stopPropagation();
  const payload = JSON.stringify({ dayId: source.dayId, index: source.index });
  event.dataTransfer.setData(DRAG_MIME, payload);
  event.dataTransfer.setData('text/plain', payload);
  event.dataTransfer.effectAllowed = 'move';
}

function allowDrop(event: React.DragEvent<HTMLDivElement>) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function dropOn(
  event: React.DragEvent<HTMLDivElement>,
  props: { dayId: string; index: number; onDrop: (from: number) => void },
) {
  event.preventDefault();
  const from = readDrag(event, props.dayId);
  if (from == null || from === props.index) return;
  event.stopPropagation();
  props.onDrop(from);
}

function readDrag(event: React.DragEvent<HTMLDivElement>, dayId: string): number | null {
  const raw = event.dataTransfer.getData(DRAG_MIME) || event.dataTransfer.getData('text/plain');
  try {
    const value = JSON.parse(raw) as { dayId?: unknown; index?: unknown };
    if (value.dayId !== dayId || typeof value.index !== 'number') return null;
    return value.index;
  } catch {
    return null;
  }
}

function slotStyle(active: boolean): React.CSSProperties {
  return { borderRadius: radius.md, outline: active ? `2px solid ${colors.primary}` : 'none', width: '100%' };
}

const styles = StyleSheet.create({
  glyph: { color: colors.textMuted, fontSize: fontSize.lg },
});

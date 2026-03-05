import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { menuStyle, menuStyleTop, rowStyle, styles } from './ClientProfileSectionsBoard.styles';
import type { SectionId, SectionItem } from './ClientProfileSectionsBoard.types';

type Props = {
  hasTrainingPlan: boolean;
  item: SectionItem;
  onArchive: () => void;
  onDropReorderByIndex: (sourceIndex: null | number, targetIndex: number) => void;
  onOpenTrainingPlanner: () => void;
  rowIndex: number;
  onToggleMenu: () => void;
  onUnassignTrainingPlan: () => void;
  placeMenuUp: boolean;
  showMenu: boolean;
  t: (key: string, params?: Record<string, number | string>) => string;
  trainingPlanName?: string;
};

export function ClientProfileSectionRow(props: Props): React.JSX.Element {
  const dragProps = readDragProps(props.item.id, props.rowIndex, props.onDropReorderByIndex);
  return (
    <div {...dragProps} style={rowStyle}>
      <RowMain
        item={props.item}
        onOpenTrainingPlanner={props.onOpenTrainingPlanner}
        onToggleMenu={props.onToggleMenu}
        t={props.t}
        trainingPlanName={props.trainingPlanName}
      />
      {props.showMenu ? (
        <RowMenu
          hasTrainingPlan={props.hasTrainingPlan}
          onArchive={props.onArchive}
          onUnassignTrainingPlan={props.onUnassignTrainingPlan}
          placeMenuUp={props.placeMenuUp}
          sectionId={props.item.id}
          t={props.t}
        />
      ) : null}
    </div>
  );
}

function RowMain(props: {
  item: SectionItem;
  onOpenTrainingPlanner: () => void;
  onToggleMenu: () => void;
  t: Props['t'];
  trainingPlanName?: string;
}): React.JSX.Element {
  const subtitle = readSubtitle(props.item, props.trainingPlanName, props.t);
  return (
    <>
      <Text style={styles.dragHandle}>{'⋮⋮'}</Text>
      <View style={styles.iconShell}>
        <Text style={styles.iconLabel}>{props.item.icon}</Text>
      </View>
      <Pressable
        onPress={() => onOpenSection(props.item.id, props.onOpenTrainingPlanner)}
        style={styles.rowText}
      >
        <Text style={styles.rowTitle}>{props.t(props.item.titleKey)}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </Pressable>
      <Pressable onPress={props.onToggleMenu} style={styles.menuButton}>
        <Text style={styles.menuLabel}>{'⋯'}</Text>
      </Pressable>
      <Text style={styles.chevron}>{'›'}</Text>
    </>
  );
}

function RowMenu(props: {
  hasTrainingPlan: boolean;
  onArchive: () => void;
  onUnassignTrainingPlan: () => void;
  placeMenuUp: boolean;
  sectionId: SectionId;
  t: Props['t'];
}): React.JSX.Element {
  const style = props.placeMenuUp ? menuStyleTop : menuStyle;
  return (
    <div style={style}>
      {props.sectionId === 'training' && props.hasTrainingPlan ? (
        <Pressable onPress={props.onUnassignTrainingPlan} style={styles.menuAction}>
          <Text style={styles.menuActionLabel}>
            {props.t('coach.clientProfile.sections.actions.unassignTraining')}
          </Text>
        </Pressable>
      ) : null}
      <Pressable onPress={props.onArchive} style={styles.menuAction}>
        <Text style={styles.menuActionLabel}>
          {props.t('coach.clientProfile.sections.actions.archive')}
        </Text>
      </Pressable>
    </div>
  );
}

function readDragProps(
  itemId: SectionId,
  rowIndex: number,
  onDropReorderByIndex: (sourceIndex: null | number, targetIndex: number) => void,
) {
  return {
    draggable: true,
    onDragOver: onDragOverRow,
    onDragStart: (event: React.DragEvent<HTMLDivElement>) =>
      onDragStartRow(event, itemId, rowIndex),
    onDrop: (event: React.DragEvent<HTMLDivElement>) =>
      onDropRow(event, rowIndex, onDropReorderByIndex),
  };
}

function onOpenSection(id: SectionId, onOpenTrainingPlanner: () => void): void {
  if (id === 'training') onOpenTrainingPlanner();
}

function readSubtitle(
  item: SectionItem,
  trainingPlanName: string | undefined,
  t: Props['t'],
): string {
  if (item.id !== 'training') return t(item.emptyKey);
  return trainingPlanName || t(item.emptyKey);
}

function onDragOverRow(event: React.DragEvent<HTMLDivElement>): void {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function onDragStartRow(
  event: React.DragEvent<HTMLDivElement>,
  itemId: SectionId,
  rowIndex: number,
): void {
  const payload = JSON.stringify({ rowIndex, sectionId: itemId });
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', payload);
  event.dataTransfer.setData('application/json', payload);
}

function onDropRow(
  event: React.DragEvent<HTMLDivElement>,
  rowIndex: number,
  onDropReorderByIndex: (sourceIndex: null | number, targetIndex: number) => void,
): void {
  event.preventDefault();
  event.stopPropagation();
  const sourceIndex = readSourceIndex(event);
  onDropReorderByIndex(sourceIndex, rowIndex);
}

function readSourceIndex(event: React.DragEvent<HTMLDivElement>): null | number {
  const textPayload = parseDragPayload(event.dataTransfer.getData('text/plain'));
  if (textPayload) return textPayload.rowIndex;
  const jsonPayload = parseDragPayload(event.dataTransfer.getData('application/json'));
  return jsonPayload?.rowIndex ?? null;
}

function parseDragPayload(raw: string): null | { rowIndex: number; sectionId: SectionId } {
  try {
    const value = JSON.parse(raw) as { rowIndex?: unknown; sectionId?: unknown };
    if (typeof value.rowIndex !== 'number') return null;
    if (!isSectionId(value.sectionId)) return null;
    return { rowIndex: value.rowIndex, sectionId: value.sectionId };
  } catch {
    return null;
  }
}

function isSectionId(value: unknown): value is SectionId {
  return (
    value === 'training' ||
    value === 'nutrition' ||
    value === 'mood' ||
    value === 'volume' ||
    value === 'progress' ||
    value === 'anthropometrics' ||
    value === 'planning' ||
    value === 'external' ||
    value === 'incidents' ||
    value === 'chat'
  );
}

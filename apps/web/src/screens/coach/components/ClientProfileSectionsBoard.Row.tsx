import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { menuStyle, menuStyleTop, expandedRowStyle, rowStyle, styles } from './ClientProfileSectionsBoard.styles';
import type { SectionId, SectionItem } from './ClientProfileSectionsBoard.types';
import { Badge, IconButton, colors } from '@trainerpro/ui';
import { ClientComparePanel } from './ClientComparePanel';
import { ClientTimelineSubtitle } from './ClientTimelineSubtitle';
import { ClientProgressActivitySubtitle } from './ClientProgressActivitySubtitle';

type Props = {
  chatSubtitle?: string;
  chatUnread?: boolean;
  incidentCount?: number;
  incidentSubtitle?: string;
  hasTrainingPlan: boolean;
  item: SectionItem;
  moodSubtitle?: string;
  nutritionSubtitle?: string;
  onArchive: () => void;
  testsSubtitle?: string;
  onDropReorderByIndex: (sourceIndex: null | number, targetIndex: number) => void;
  onOpenChat?: () => void;
  onOpenIncidents?: () => void;
  onOpenMood?: () => void;
  onOpenNutrition?: () => void;
  onOpenProgress?: () => void;
  onOpenTests?: () => void;
  onOpenTimeline: () => void;
  onOpenTrainingPlanner: () => void;
  rowIndex: number;
  onToggleMenu: () => void;
  onUnassignTrainingPlan: () => void;
  placeMenuUp: boolean;
  showMenu: boolean;
  t: (key: string, params?: Record<string, number | string>) => string;
  trainingPlanName?: string;
  clientId: string;
};

export function ClientProfileSectionRow(props: Props): React.JSX.Element {
  const dragProps = readDragProps(props.item.id, props.rowIndex, props.onDropReorderByIndex);
  const hasInlinePanel = props.item.id === 'compare';
  const rowMain = (
    <RowMain
      chatSubtitle={props.chatSubtitle}
      chatUnread={props.chatUnread}
      incidentCount={props.incidentCount}
      incidentSubtitle={props.incidentSubtitle}
      item={props.item}
      clientId={props.clientId}
      moodSubtitle={props.moodSubtitle}
      nutritionSubtitle={props.nutritionSubtitle}
      onOpenChat={props.onOpenChat}
      onOpenIncidents={props.onOpenIncidents}
      onOpenMood={props.onOpenMood}
      testsSubtitle={props.testsSubtitle}
      onOpenNutrition={props.onOpenNutrition}
      onOpenProgress={props.onOpenProgress}
      onOpenTests={props.onOpenTests}
      onOpenTimeline={props.onOpenTimeline}
      onOpenTrainingPlanner={props.onOpenTrainingPlanner}
      onToggleMenu={props.onToggleMenu}
      t={props.t}
      trainingPlanName={props.trainingPlanName}
    />
  );
  return (
    <div {...dragProps} style={hasInlinePanel ? expandedRowStyle : rowStyle}>
      {hasInlinePanel ? <View style={styles.rowPanelHeader}>{rowMain}</View> : rowMain}
      {hasInlinePanel ? (
        <View style={styles.inlinePanel}>
          <ClientComparePanel clientId={props.clientId} t={props.t} />
        </View>
      ) : null}
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
  chatSubtitle?: string;
  chatUnread?: boolean;
  incidentCount?: number;
  incidentSubtitle?: string;
  clientId: string;
  item: SectionItem;
  moodSubtitle?: string;
  nutritionSubtitle?: string;
  onOpenChat?: () => void;
  onOpenIncidents?: () => void;
  onOpenMood?: () => void;
  testsSubtitle?: string;
  onOpenNutrition?: () => void;
  onOpenProgress?: () => void;
  onOpenTests?: () => void;
  onOpenTimeline: () => void;
  onOpenTrainingPlanner: () => void;
  onToggleMenu: () => void;
  t: Props['t'];
  trainingPlanName?: string;
}): React.JSX.Element {
  const subtitle = readSubtitle(
    props.item,
    props.trainingPlanName,
    props.t,
    props.moodSubtitle,
    props.testsSubtitle,
    props.nutritionSubtitle,
    props.chatSubtitle,
    props.incidentSubtitle,
  );
  return (
    <>
      <Text style={styles.dragHandle}>{'⋮⋮'}</Text>
      <View style={[styles.iconShell, { backgroundColor: props.item.badgeColor }]}>
        {props.item.icon({ color: props.item.iconColor || colors.textMuted, size: 18 })}
      </View>
      <Pressable onPress={() => onOpenSection(props)} style={styles.rowText}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowTitle}>{props.t(props.item.titleKey)}</Text>
          {props.item.id === 'chat' && props.chatUnread ? (
            <Badge label={props.t('coach.clientProfile.details.chat.unread')} tone="danger" />
          ) : null}
          {props.item.id === 'incidents' && props.incidentCount ? (
            <Badge label={String(props.incidentCount)} tone="danger" />
          ) : null}
        </View>
        {props.item.id === 'progress' ? (
          <ClientProgressActivitySubtitle clientId={props.clientId} style={styles.rowSubtitle} t={props.t} />
        ) : props.item.id === 'timeline' ? (
          <ClientTimelineSubtitle clientId={props.clientId} style={styles.rowSubtitle} t={props.t} />
        ) : (
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        )}
      </Pressable>
      <IconButton
        accessibilityLabel={props.t('coach.clientProfile.sections.actions.menu')}
        icon={(color) => <Text style={[styles.menuLabel, { color }]}>{'⋯'}</Text>}
        onPress={props.onToggleMenu}
      />
      <Pressable accessibilityRole="button" onPress={() => onOpenSection(props)}>
        <Text style={styles.chevron}>{'›'}</Text>
      </Pressable>
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
          <Text style={styles.menuActionLabel}>{props.t('coach.clientProfile.sections.actions.unassignTraining')}</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={props.onArchive} style={styles.menuAction}>
        <Text style={styles.menuActionLabel}>{props.t('coach.clientProfile.sections.actions.archive')}</Text>
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
    onDragStart: (event: React.DragEvent<HTMLDivElement>) => onDragStartRow(event, itemId, rowIndex),
    onDrop: (event: React.DragEvent<HTMLDivElement>) => onDropRow(event, rowIndex, onDropReorderByIndex),
  };
}

function onOpenSection(props: {
  item: SectionItem;
  onOpenChat?: () => void;
  onOpenIncidents?: () => void;
  onOpenMood?: () => void;
  onOpenNutrition?: () => void;
  onOpenProgress?: () => void;
  onOpenTests?: () => void;
  onOpenTimeline: () => void;
  onOpenTrainingPlanner: () => void;
}): void {
  if (props.item.id === 'training') props.onOpenTrainingPlanner();
  if (props.item.id === 'progress') props.onOpenProgress?.();
  if (props.item.id === 'nutrition') props.onOpenNutrition?.();
  if (props.item.id === 'tests') props.onOpenTests?.();
  if (props.item.id === 'mood') props.onOpenMood?.();
  if (props.item.id === 'timeline') props.onOpenTimeline();
  if (props.item.id === 'chat') props.onOpenChat?.();
  if (props.item.id === 'incidents') props.onOpenIncidents?.();
}

function readSubtitle(
  item: SectionItem,
  trainingPlanName: string | undefined,
  t: Props['t'],
  moodSubtitle?: string,
  testsSubtitle?: string,
  nutritionSubtitle?: string,
  chatSubtitle?: string,
  incidentSubtitle?: string,
): string {
  if (item.id === 'training') return trainingPlanName || t(item.emptyKey);
  if (item.id === 'mood' && moodSubtitle) return moodSubtitle;
  if (item.id === 'tests' && testsSubtitle) return testsSubtitle;
  if (item.id === 'nutrition' && nutritionSubtitle) return nutritionSubtitle;
  if (item.id === 'chat' && chatSubtitle) return chatSubtitle;
  if (item.id === 'incidents' && incidentSubtitle) return incidentSubtitle;
  return t(item.emptyKey);
}

function onDragOverRow(event: React.DragEvent<HTMLDivElement>): void {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function onDragStartRow(event: React.DragEvent<HTMLDivElement>, itemId: SectionId, rowIndex: number): void {
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
    value === 'tests' ||
    value === 'mood' ||
    value === 'volume' ||
    value === 'progress' ||
    value === 'anthropometrics' ||
    value === 'planning' ||
    value === 'external' ||
    value === 'incidents' ||
    value === 'chat' ||
    value === 'timeline' ||
    value === 'compare'
  );
}

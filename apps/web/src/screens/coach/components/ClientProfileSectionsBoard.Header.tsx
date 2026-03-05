import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './ClientProfileSectionsBoard.styles';

import type { SectionId } from './ClientProfileSectionsBoard.types';

type Props = {
  archivedCount: number;
  onDropArchive: (sourceId: null | SectionId) => void;
  onToggleArchived: () => void;
  t: (key: string, params?: Record<string, number | string>) => string;
};

export function ClientProfileSectionsBoardHeader(props: Props): React.JSX.Element {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{props.t('coach.clientProfile.sections.title')}</Text>
      <ArchiveButton
        archivedCount={props.archivedCount}
        onDropArchive={props.onDropArchive}
        onToggleArchived={props.onToggleArchived}
        t={props.t}
      />
    </View>
  );
}

function ArchiveButton(props: Props): React.JSX.Element {
  const danger = props.archivedCount > 0;
  const tone = danger ? styles.archivedButtonDanger : styles.archivedButton;
  const textTone = danger ? styles.archivedLabel : styles.archivedLabelNeutral;
  const label = `✉ ${props.t('coach.clientProfile.sections.archived', {
    count: props.archivedCount,
  })}`;
  return (
    <div onDragOver={preventDefault} onDrop={(event) => onDropArchive(event, props.onDropArchive)}>
      <Pressable onPress={props.onToggleArchived} style={tone}>
        <Text style={textTone}>{label}</Text>
      </Pressable>
    </div>
  );
}

function preventDefault(event: React.DragEvent<HTMLDivElement>): void {
  event.preventDefault();
}

function onDropArchive(
  event: React.DragEvent<HTMLDivElement>,
  onDropArchiveAction: (sourceId: null | SectionId) => void,
): void {
  event.preventDefault();
  event.stopPropagation();
  const sourceId = readSourceId(event);
  onDropArchiveAction(sourceId && isSectionId(sourceId) ? sourceId : null);
}

function readSourceId(event: React.DragEvent<HTMLDivElement>): null | string {
  const textPayload = parsePayload(event.dataTransfer.getData('text/plain'));
  if (textPayload) return textPayload.sectionId;
  const jsonPayload = parsePayload(event.dataTransfer.getData('application/json'));
  if (jsonPayload) return jsonPayload.sectionId;
  return event.dataTransfer.getData('text/plain') || event.dataTransfer.getData('text');
}

function parsePayload(raw: string): null | { rowIndex: number; sectionId: string } {
  try {
    const parsed = JSON.parse(raw) as { rowIndex?: unknown; sectionId?: unknown };
    if (typeof parsed.rowIndex !== 'number' || typeof parsed.sectionId !== 'string') {
      return null;
    }
    return { rowIndex: parsed.rowIndex, sectionId: parsed.sectionId };
  } catch {
    return null;
  }
}

function isSectionId(value: string): value is SectionId {
  return [
    'training',
    'nutrition',
    'mood',
    'volume',
    'progress',
    'anthropometrics',
    'planning',
    'external',
    'incidents',
    'chat',
  ].includes(value);
}

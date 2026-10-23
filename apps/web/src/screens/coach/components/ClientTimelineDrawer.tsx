import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconButton, colors, fontSize, radius, space } from '@trainerpro/ui';
import { SessionDetailModal } from '../progress/SessionDetailModal';
import { backdropStyle, drawerStyle, styles as boardStyles } from './ClientProfileSectionsBoard.styles';
import { ClientTimelinePanel } from './ClientTimelinePanel';
import { TIMELINE_FILTERS, type TimelineFilter } from './timeline.helpers';

type Translate = (key: string, options?: Record<string, number | string>) => string;

type Props = {
  clientId: string;
  clientName: string;
  onClose: () => void;
  t: Translate;
  visible: boolean;
};

export function ClientTimelineDrawer(props: Props): React.JSX.Element | null {
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [sessionId, setSessionId] = useState<null | string>(null);
  useDrawerDismiss(props.visible, sessionId, props.onClose, setSessionId);
  if (!props.visible) return null;
  return (
    <>
      <div {...dialogProps(props.t)} style={panelStyle}>
        <DrawerHeader clientName={props.clientName} onClose={props.onClose} t={props.t} />
        <FilterChips onChange={setFilter} t={props.t} value={filter} />
        <ClientTimelinePanel clientId={props.clientId} filter={filter} onOpenSession={setSessionId} t={props.t} />
      </div>
      <div onClick={props.onClose} style={backdropStyle} />
      <SessionDetailModal onClose={() => setSessionId(null)} sessionId={sessionId} />
    </>
  );
}

function useDrawerDismiss(
  visible: boolean,
  sessionId: null | string,
  onClose: () => void,
  clearSession: (value: null) => void,
): void {
  useEffect(() => {
    if (!visible) return undefined;
    const onKey = (event: KeyboardEvent) => onEscape(event, sessionId, onClose, clearSession);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearSession, onClose, sessionId, visible]);
}

function onEscape(
  event: KeyboardEvent,
  sessionId: null | string,
  onClose: () => void,
  clearSession: (value: null) => void,
): void {
  if (event.key !== 'Escape') return;
  if (sessionId) {
    clearSession(null);
    return;
  }
  onClose();
}

function DrawerHeader(props: { clientName: string; onClose: () => void; t: Translate }): React.JSX.Element {
  return (
    <View style={boardStyles.drawerHeader}>
      <View style={styles.heading}>
        <Text style={boardStyles.drawerTitle}>{props.t('coach.timeline.title')}</Text>
        {props.clientName ? <Text style={styles.clientName}>{props.clientName}</Text> : null}
      </View>
      <IconButton
        accessibilityLabel={props.t('common.close')}
        icon={(color) => <Text style={[boardStyles.drawerClose, { color }]}>{'×'}</Text>}
        onPress={props.onClose}
      />
    </View>
  );
}

function FilterChips(props: {
  onChange: (filter: TimelineFilter) => void;
  t: Translate;
  value: TimelineFilter;
}): React.JSX.Element {
  return (
    <View style={styles.filters}>
      {TIMELINE_FILTERS.map((filter) => (
        <FilterChip filter={filter} key={filter} onChange={props.onChange} selected={filter === props.value} t={props.t} />
      ))}
    </View>
  );
}

function FilterChip(props: {
  filter: TimelineFilter;
  onChange: (filter: TimelineFilter) => void;
  selected: boolean;
  t: Translate;
}): React.JSX.Element {
  return (
    <Pressable onPress={() => props.onChange(props.filter)} style={[styles.chip, props.selected && styles.chipOn]}>
      <Text style={[styles.chipLabel, props.selected && styles.chipLabelOn]}>
        {props.t(`coach.timeline.filter.${props.filter}`)}
      </Text>
    </Pressable>
  );
}

function dialogProps(t: Translate): React.HTMLAttributes<HTMLDivElement> {
  return { 'aria-label': t('coach.timeline.title'), 'aria-modal': true, role: 'dialog' };
}

const panelStyle: React.CSSProperties = {
  ...drawerStyle(true),
  maxWidth: '520px',
  overflow: 'hidden',
  width: 'min(92vw, 480px)',
};

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  chipLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' },
  chipLabelOn: { color: colors.onPrimary },
  chipOn: { backgroundColor: colors.primary },
  clientName: { color: colors.textMuted, fontSize: fontSize.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm },
  heading: { flex: 1, gap: 2 },
});

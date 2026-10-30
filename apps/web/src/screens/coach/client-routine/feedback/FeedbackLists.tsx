import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, colors, fontSize, radius, space } from '@trainerpro/ui';
import type { FeedbackIncident, FeedbackNote } from '../../../../data/hooks/useClientFeedback';
import { useFormatDate } from '../../../../i18n/useFormatDate';

type Translate = (key: string, options?: Record<string, unknown>) => string;

function Card(props: { badges: React.ReactNode; date: string; text: string; title?: null | string }): React.JSX.Element {
  const format = useFormatDate();
  return (
    <View style={styles.card}>
      <View style={styles.meta}>
        <Text style={styles.date}>{format(props.date)}</Text>
        <View style={styles.badges}>{props.badges}</View>
      </View>
      {props.title ? <Text style={styles.title}>{props.title}</Text> : null}
      <Text style={styles.text}>{props.text}</Text>
    </View>
  );
}

function Column(props: { children: React.ReactNode; count: number; empty: string; title: string }): React.JSX.Element {
  return (
    <View style={styles.column}>
      <Text style={styles.heading}>{`${props.title} (${props.count})`}</Text>
      {props.count === 0 ? <Text style={styles.empty}>{props.empty}</Text> : props.children}
    </View>
  );
}

/** Incidents on the left, notes on the right. Newest first; nothing in here can be edited. */
export function FeedbackLists(props: {
  incidents: FeedbackIncident[];
  notes: FeedbackNote[];
  t: Translate;
}): React.JSX.Element {
  const { t } = props;
  return (
    <View style={styles.columns}>
      <Column
        count={props.incidents.length}
        empty={t('coach.clientFeedback.emptyIncidents')}
        title={t('coach.clientFeedback.incidents')}
      >
        {props.incidents.map((incident) => (
          <Card
            badges={
              <>
                <Badge label={t(`coach.clientFeedback.category.${incident.category}`)} />
                <Badge label={t(`coach.clientFeedback.severity.${incident.severity}`)} />
                <Badge label={t(`coach.clientFeedback.status.${incident.status}`)} />
              </>
            }
            date={incident.createdAt}
            key={incident.id}
            text={incident.description}
            title={incident.tag ? t(`coach.clientFeedback.tag.${incident.tag}`, { defaultValue: incident.tag }) : null}
          />
        ))}
      </Column>
      <Column
        count={props.notes.length}
        empty={t('coach.clientFeedback.emptyNotes')}
        title={t('coach.clientFeedback.notes')}
      >
        {props.notes.map((note) => (
          <Card
            badges={<Badge label={t(`coach.clientFeedback.category.${note.category}`)} />}
            date={note.createdAt}
            key={note.id}
            text={note.text}
            title={note.exerciseName}
          />
        ))}
      </Column>
    </View>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.xs,
    padding: space.sm,
  },
  column: { flex: 1, gap: space.sm, minWidth: 280 },
  columns: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  date: { color: colors.textMuted, fontSize: fontSize.xs },
  empty: { color: colors.textMuted, fontSize: fontSize.sm },
  heading: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  meta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'space-between' },
  text: { color: colors.text, fontSize: fontSize.sm },
  title: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
});

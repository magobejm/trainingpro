import { QueryResult } from '../../components/AsyncStatus';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import {
  useNotificationPreferencesQuery,
  useSetNotificationPreferenceMutation,
  type NotificationPreference,
} from '../../data/hooks/useNotificationPreferences';
import { Button, Card, colors, fontSize, radius, space } from '@trainerpro/ui';

const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SM = 'sm' as const;

const TOPIC_KEYS: Array<NotificationPreference['topic']> = [
  'SESSION_COMPLETED',
  'INCIDENT_CRITICAL',
  'CLIENT_INACTIVE_3D',
  'ADHERENCE_LOW_WEEKLY',
  'CLIENT_REMINDER',
];

export function NotificationSettingsScreen(): React.JSX.Element {
  const vm = useNotificationSettingsModel();
  return <NotificationSettingsView {...vm} />;
}

function useNotificationSettingsModel() {
  const { t } = useTranslation();
  const query = useNotificationPreferencesQuery();
  const mutation = useSetNotificationPreferenceMutation();
  const update = (topic: NotificationPreference['topic'], enabled: boolean) => mutation.mutate({ enabled, topic });
  return { query, mutation, t, update };
}

type ViewModel = ReturnType<typeof useNotificationSettingsModel>;

function NotificationSettingsView(props: ViewModel) {
  const status = QueryResult({
    emptyTitle: props.t('coach.notifications.title'),
    skeleton: 'panel',
    error: props.query.error,
    isError: props.query.isError,
    isLoading: props.query.isLoading,
    itemCount: TOPIC_KEYS.length,
    onRetry: () => void props.query.refetch(),
  });
  const preferences = props.query.data ?? [];
  return (
    <View style={styles.page}>
      <Text style={styles.title}>{props.t('coach.notifications.title')}</Text>
      <Text style={styles.subtitle}>{props.t('coach.notifications.subtitle')}</Text>
      {status ?? <Card style={styles.list}>{renderRows(TOPIC_KEYS, preferences, props)}</Card>}
    </View>
  );
}

function renderRows(
  topics: Array<NotificationPreference['topic']>,
  preferences: NotificationPreference[],
  props: ViewModel,
) {
  return topics.map((topic) => {
    const enabled = preferences.find((item) => item.topic === topic)?.enabled ?? false;
    return (
      <View key={topic} style={styles.row}>
        <Text style={styles.rowLabel}>{labelForTopic(topic, props.t)}</Text>
        <Button
          loading={props.mutation.isPending && props.mutation.variables?.topic === topic}
          disabled={props.mutation.isPending}
          label={readToggleLabel(enabled, props.t)}
          onPress={() => props.update(topic, !enabled)}
          size={SIZE_SM}
          style={styles.toggle}
          variant={enabled ? undefined : VARIANT_SECONDARY}
        />
      </View>
    );
  });
}

function labelForTopic(topic: NotificationPreference['topic'], t: (key: string) => string): string {
  return t(`coach.notifications.topic.${topic.toLowerCase()}`);
}

function readToggleLabel(enabled: boolean, t: (key: string) => string): string {
  return enabled ? t('coach.notifications.on') : t('coach.notifications.off');
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.sm,
    padding: space.md,
  },
  page: {
    backgroundColor: colors.background,
    flex: 1,
    gap: space.md,
    padding: space.lg,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: colors.text,
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '700',
    paddingRight: space.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  toggle: {
    minWidth: 88,
  },
});

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { useSessionQuery, type SessionItem } from '../../data/hooks/useTodaySession';

type Props = {
  sessionId: string;
};

export function CoachSessionDetailScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const query = useSessionQuery(props.sessionId);
  if (query.isLoading) {
    return <ActivityIndicator />;
  }
  if (!query.data) {
    return <Text style={styles.error}>{t('coach.notice.loadError')}</Text>;
  }
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{t('coach.notice.sessionTitle')}</Text>
      <Text style={styles.status}>{t(`coach.notice.status.${query.data.status}`)}</Text>
      {renderItems(query.data.items, t('coach.notice.sessionEmpty'))}
    </ScrollView>
  );
}

function renderItems(items: SessionItem[], empty: string): React.JSX.Element {
  if (items.length === 0) {
    return <Text style={styles.empty}>{empty}</Text>;
  }
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Text key={item.id} style={styles.item}>
          {item.displayName}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: '#5d6f85', fontSize: 14 },
  error: { color: '#9b1c1c', fontSize: 14, padding: 18 },
  item: { color: '#1a2a43', fontSize: 15, fontWeight: '700' },
  list: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe3ef',
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  page: { gap: 12, padding: 18 },
  status: { color: '#5d6f85', fontSize: 14 },
  title: { color: '#0f2036', fontSize: 22, fontWeight: '800' },
});

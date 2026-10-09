import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';
import { useIncidentQuery, useRespondIncidentMutation, useReviewIncidentMutation } from '../../data/hooks/useIncidentDetail';

type Props = {
  incidentId: string;
};

export function CoachIncidentDetailScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const query = useIncidentQuery(props.incidentId);
  const review = useReviewIncidentMutation(props.incidentId);
  const respond = useRespondIncidentMutation(props.incidentId);
  const [response, setResponse] = React.useState('');
  if (query.isLoading) {
    return <ActivityIndicator />;
  }
  if (!query.data) {
    return <Text style={styles.error}>{t('coach.notice.loadError')}</Text>;
  }
  const incident = query.data;
  return (
    <View style={styles.page}>
      <Text style={styles.title}>{t('coach.notice.incidentTitle')}</Text>
      <Text style={styles.body}>{incident.description}</Text>
      <Text style={styles.status}>{t(`coach.notice.incidentStatus.${incident.status}`)}</Text>
      {incident.coachResponse ? <Text style={styles.body}>{incident.coachResponse}</Text> : null}
      {incident.status === 'OPEN' ? (
        <Pressable onPress={() => review.mutate()} style={styles.button}>
          <Text style={styles.buttonLabel}>{t('coach.notice.incidentReview')}</Text>
        </Pressable>
      ) : null}
      <TextInput
        onChangeText={setResponse}
        placeholder={t('coach.notice.incidentPlaceholder')}
        style={styles.input}
        value={response}
      />
      <Pressable disabled={response.trim().length < 2} onPress={() => respond.mutate(response.trim())} style={styles.button}>
        <Text style={styles.buttonLabel}>{t('coach.notice.incidentSend')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: '#1a2a43', fontSize: 15 },
  button: {
    alignItems: 'center',
    backgroundColor: '#ec4899',
    borderRadius: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  buttonLabel: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  error: { color: '#9b1c1c', fontSize: 14, padding: 18 },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe3ef',
    borderRadius: 10,
    borderWidth: 1,
    color: '#1a2a43',
    minHeight: 72,
    padding: 10,
  },
  page: { gap: 12, padding: 18 },
  status: { color: '#5d6f85', fontSize: 13, fontWeight: '700' },
  title: { color: '#0f2036', fontSize: 22, fontWeight: '800' },
});

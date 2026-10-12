import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ChatCallProposal } from '../../../data/hooks/useChat';
import { useAcceptCallProposalMutation, useCounterCallProposalMutation } from '../../../data/hooks/useChat';
import { CALL_CARD_TONES, callCardActions, callCardTone, callTimeOptions } from '../call-proposal-card.logic';
import { Badge, Button, Card, colors, fontSize, Select, space } from '@trainerpro/ui';
export function CallProposalCard({ proposal }: { proposal: ChatCallProposal }): React.JSX.Element {
  const { t } = useTranslation();
  const tone = CALL_CARD_TONES[callCardTone(proposal)];
  const actions = callCardActions(proposal, 'COACH');
  const accepted = proposal.status === 'accepted';
  const cancelled = proposal.status === 'cancelled';
  const [countering, setCountering] = useState(false);
  const [time, setTime] = useState(proposal.proposedTime);
  const accept = useAcceptCallProposalMutation();
  const counter = useCounterCallProposalMutation();
  const titleKey = cancelled
    ? 'coach.chat.call.cancelledTitle'
    : accepted
      ? 'coach.chat.call.confirmedTitle'
      : 'coach.chat.call.requestTitle';
  const badgeKey = cancelled
    ? 'coach.chat.call.cancelledBadge'
    : accepted
      ? 'coach.chat.call.scheduledBadge'
      : 'coach.chat.call.pendingBadge';
  return (
    <Card
      style={[
        styles.card,
        cardColorStyle(cancelled ? colors.surfaceMuted : tone.bg, cancelled ? colors.border : tone.border),
      ]}
    >
      <View style={styles.heading}>
        <Text style={styles.title}>{t(titleKey)}</Text>
        <Badge label={t(badgeKey)} tone={cancelled ? 'neutral' : accepted ? 'success' : 'warning'} />
      </View>
      <Text style={styles.text}>{t('coach.chat.call.date', { date: proposal.date })}</Text>
      <Text style={styles.text}>
        {t(accepted ? 'coach.chat.call.confirmedTime' : 'coach.chat.call.proposedTime', { time: proposal.proposedTime })}
      </Text>
      <Text style={styles.text}>
        {t('coach.chat.call.lastProposedBy', {
          who: t(proposal.lastProposedBy === 'COACH' ? 'coach.chat.call.coach' : 'coach.chat.call.client'),
        })}
      </Text>
      {actions.includes('accept') ? (
        <Button
          label={t('coach.chat.call.accept')}
          loading={accept.isPending}
          disabled={counter.isPending}
          onPress={() => accept.mutate(proposal.id)}
          size="sm"
        />
      ) : null}
      {actions.includes('counter') && !countering ? (
        <Button label={t('coach.chat.call.counter')} onPress={() => setCountering(true)} variant="secondary" size="sm" />
      ) : null}
      {countering && actions.includes('counter') ? (
        <CounterForm
          onCancel={() => setCountering(false)}
          onSend={() => counter.mutate({ proposalId: proposal.id, time }, { onSuccess: () => setCountering(false) })}
          onTime={setTime}
          sending={counter.isPending}
          time={time}
        />
      ) : null}
    </Card>
  );
}
function CounterForm(props: {
  onCancel: () => void;
  onSend: () => void;
  onTime: (time: string) => void;
  sending: boolean;
  time: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.counter}>
      <Select
        label={t('coach.chat.call.counterLabel')}
        onChange={props.onTime}
        options={callTimeOptions().map((option) => ({ label: option, value: option }))}
        value={props.time}
      />
      <Button label={t('coach.chat.call.sendCounter')} loading={props.sending} onPress={props.onSend} size="sm" />
      <Button label={t('coach.chat.call.cancel')} onPress={props.onCancel} size="sm" variant="secondary" />
    </View>
  );
}
function cardColorStyle(backgroundColor: string, borderColor: string) {
  return StyleSheet.create({ tone: { backgroundColor, borderColor } }).tone;
}
const styles = StyleSheet.create({
  card: { gap: space.sm },
  heading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.sm },
  title: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  text: { color: colors.textMuted, fontSize: fontSize.xs },
  counter: { gap: space.sm },
});

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ChatCallProposal } from '../../../data/hooks/useChat';
import { useAcceptCallProposalMutation, useCounterCallProposalMutation } from '../../../data/hooks/useChat';
import { CALL_CARD_TONES, callCardActions, callCardTone, callTimeOptions } from '../call-proposal-card.logic';

const TEXT_LIGHT = '#f8fafc';

export function CallProposalCard(props: { proposal: ChatCallProposal }): React.JSX.Element {
  const { t } = useTranslation();
  const proposal = props.proposal;
  const tone = CALL_CARD_TONES[callCardTone(proposal)];
  const actions = callCardActions(proposal, 'COACH');
  const accepted = proposal.status === 'accepted';
  const [countering, setCountering] = useState(false);
  const [time, setTime] = useState(proposal.proposedTime);
  const accept = useAcceptCallProposalMutation();
  const counter = useCounterCallProposalMutation();

  return (
    <View style={{ backgroundColor: tone.bg, borderColor: tone.border, borderRadius: 14, borderWidth: 1, padding: 12 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: TEXT_LIGHT, fontSize: 13, fontWeight: 'bold' }}>
          {t(accepted ? 'coach.chat.call.confirmedTitle' : 'coach.chat.call.requestTitle')}
        </Text>
        <Text style={{ color: TEXT_LIGHT, fontSize: 11, fontWeight: 'bold' }}>
          {t(accepted ? 'coach.chat.call.scheduledBadge' : 'coach.chat.call.pendingBadge')}
        </Text>
      </View>
      <Text style={{ color: TEXT_LIGHT, fontSize: 12, marginTop: 6 }}>
        {t('coach.chat.call.date', { date: proposal.date })}
      </Text>
      <Text style={{ color: TEXT_LIGHT, fontSize: 12 }}>
        {t(accepted ? 'coach.chat.call.confirmedTime' : 'coach.chat.call.proposedTime', { time: proposal.proposedTime })}
      </Text>
      <Text style={{ color: TEXT_LIGHT, fontSize: 11, marginTop: 4 }}>
        {t('coach.chat.call.lastProposedBy', {
          who: t(proposal.lastProposedBy === 'COACH' ? 'coach.chat.call.coach' : 'coach.chat.call.client'),
        })}
      </Text>
      {actions.includes('accept') ? (
        <CardButton label={t('coach.chat.call.accept')} onPress={() => accept.mutate(proposal.id)} />
      ) : null}
      {actions.includes('counter') && !countering ? (
        <CardButton label={t('coach.chat.call.counter')} onPress={() => setCountering(true)} />
      ) : null}
      {countering ? (
        <CounterForm
          onCancel={() => setCountering(false)}
          onSend={() => counter.mutate({ proposalId: proposal.id, time }, { onSuccess: () => setCountering(false) })}
          onTime={setTime}
          time={time}
        />
      ) : null}
    </View>
  );
}

function CardButton(props: { label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      onPress={props.onPress}
      style={{ backgroundColor: '#ffffff22', borderRadius: 10, marginTop: 8, paddingVertical: 8 }}
    >
      <Text style={{ color: TEXT_LIGHT, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>{props.label}</Text>
    </Pressable>
  );
}

function CounterForm(props: {
  onCancel: () => void;
  onSend: () => void;
  onTime: (time: string) => void;
  time: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ color: TEXT_LIGHT, fontSize: 12 }}>{t('coach.chat.call.counterLabel')}</Text>
      <select
        onChange={(event) => props.onTime(event.target.value)}
        style={{ borderRadius: 8, marginTop: 4, padding: 6 }}
        value={props.time}
      >
        {callTimeOptions().map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <CardButton label={t('coach.chat.call.sendCounter')} onPress={props.onSend} />
      <CardButton label={t('coach.chat.call.cancel')} onPress={props.onCancel} />
    </View>
  );
}

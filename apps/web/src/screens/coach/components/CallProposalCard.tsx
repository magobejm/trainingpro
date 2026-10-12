import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ChatCallProposal } from '../../../data/hooks/useChat';
import { useAcceptCallProposalMutation, useCounterCallProposalMutation } from '../../../data/hooks/useChat';
import { CALL_CARD_TONES, callCardActions, callCardTone, callTimeOptions } from '../call-proposal-card.logic';
import { Button, colors, fontSize, radius, Select, space } from '@trainerpro/ui';

const TEXT_LIGHT = colors.surfaceMuted;

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
    <View
      style={{
        backgroundColor: tone.bg,
        borderColor: tone.border,
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: space.md,
      }}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: TEXT_LIGHT, fontSize: fontSize.sm, fontWeight: 'bold' }}>
          {t(accepted ? 'coach.chat.call.confirmedTitle' : 'coach.chat.call.requestTitle')}
        </Text>
        <Text style={{ color: TEXT_LIGHT, fontSize: fontSize.xs, fontWeight: 'bold' }}>
          {t(accepted ? 'coach.chat.call.scheduledBadge' : 'coach.chat.call.pendingBadge')}
        </Text>
      </View>
      <Text style={{ color: TEXT_LIGHT, fontSize: fontSize.xs, marginTop: space.sm }}>
        {t('coach.chat.call.date', { date: proposal.date })}
      </Text>
      <Text style={{ color: TEXT_LIGHT, fontSize: fontSize.xs }}>
        {t(accepted ? 'coach.chat.call.confirmedTime' : 'coach.chat.call.proposedTime', { time: proposal.proposedTime })}
      </Text>
      <Text style={{ color: TEXT_LIGHT, fontSize: fontSize.xs, marginTop: space.xs }}>
        {t('coach.chat.call.lastProposedBy', {
          who: t(proposal.lastProposedBy === 'COACH' ? 'coach.chat.call.coach' : 'coach.chat.call.client'),
        })}
      </Text>
      {actions.includes('accept') ? (
        <CardButton
          label={t('coach.chat.call.accept')}
          loading={accept.isPending}
          onPress={() => accept.mutate(proposal.id)}
        />
      ) : null}
      {actions.includes('counter') && !countering ? (
        <CardButton label={t('coach.chat.call.counter')} onPress={() => setCountering(true)} />
      ) : null}
      {countering ? (
        <CounterForm
          onCancel={() => setCountering(false)}
          onSend={() => counter.mutate({ proposalId: proposal.id, time }, { onSuccess: () => setCountering(false) })}
          onTime={setTime}
          sending={counter.isPending}
          time={time}
        />
      ) : null}
    </View>
  );
}

function CardButton(props: { label: string; loading?: boolean; onPress: () => void }): React.JSX.Element {
  return (
    <Button
      label={props.label}
      loading={props.loading}
      onPress={props.onPress}
      size="sm"
      style={{ marginTop: space.sm }}
      variant="secondary"
    />
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
    <View style={{ marginTop: space.sm }}>
      <Text style={{ color: TEXT_LIGHT, fontSize: fontSize.xs }}>{t('coach.chat.call.counterLabel')}</Text>
      <Select
        containerStyle={{ marginTop: space.xs }}
        onChange={props.onTime}
        options={callTimeOptions().map((option) => ({ label: option, value: option }))}
        placeholder={t('coach.chat.call.counterLabel')}
        value={props.time}
      />
      <CardButton label={t('coach.chat.call.sendCounter')} loading={props.sending} onPress={props.onSend} />
      <CardButton label={t('coach.chat.call.cancel')} onPress={props.onCancel} />
    </View>
  );
}

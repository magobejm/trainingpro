import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useAcceptCallProposalMutation, useCounterCallProposalMutation } from '../../data/hooks/useChat';
import { useCancelCallProposalMutation, useCreateCallProposalMutation } from '../../data/hooks/useClientCalendar';
import type { DayCall } from './client-calendar.helpers';
import { CALL_COLOR, CALL_REQUEST_COLOR, QUICK_CALL_TIMES } from './calendar-fixed-colors';
import { CallTimeSelect } from './CallTimeSelect';

const TEXT_LIGHT = '#f8fafc';

type PanelProps = {
  call: DayCall | null;
  dateStr: string;
  scheduledCall?: DayCall | null;
};

export function CalendarCallPanel(props: PanelProps): React.JSX.Element {
  if (props.call?.status === 'pending') {
    return (
      <View>
        {props.scheduledCall ? <AcceptedCall time={props.scheduledCall.time} /> : null}
        <PendingCall call={props.call} />
      </View>
    );
  }
  return (
    <View>
      {props.call ? <AcceptedCall time={props.call.time} /> : null}
      <CallRequest dateStr={props.dateStr} />
    </View>
  );
}

function PendingCall(props: { call: DayCall }): React.JSX.Element {
  const { t } = useTranslation();
  const canRespond = props.call.lastProposedBy === 'COACH' && Boolean(props.call.proposalId);
  return (
    <View style={[styles.block, { backgroundColor: CALL_REQUEST_COLOR }]}>
      <Text style={styles.blockTitle}>{t('client.calendar.detail.pendingCall')}</Text>
      <Text style={styles.blockText}>
        {t(canRespond ? 'client.calendar.detail.coachProposes' : 'client.calendar.detail.waitingCoach', {
          time: props.call.time,
        })}
      </Text>
      {canRespond && props.call.proposalId ? (
        <PendingActions proposalId={props.call.proposalId} time={props.call.time} />
      ) : null}
    </View>
  );
}

function PendingActions(props: { proposalId: string; time: string }): React.JSX.Element {
  const { t } = useTranslation();
  const [countering, setCountering] = useState(false);
  const [time, setTime] = useState(props.time);
  const accept = useAcceptCallProposalMutation();
  const cancel = useCancelCallProposalMutation();
  const counter = useCounterCallProposalMutation();
  return (
    <View>
      <ActionButton label={t('client.calendar.detail.acceptCall')} onPress={() => accept.mutate(props.proposalId)} />
      <ActionButton label={t('client.calendar.detail.rejectCall')} onPress={() => cancel.mutate(props.proposalId)} />
      {countering ? null : (
        <ActionButton label={t('client.calendar.detail.changeCallTime')} onPress={() => setCountering(true)} />
      )}
      {countering ? (
        <View>
          <CallTimeSelect onChange={setTime} value={time} />
          <ActionButton
            label={t('client.chat.call.sendCounter')}
            onPress={() => counter.mutate({ proposalId: props.proposalId, time }, { onSuccess: () => setCountering(false) })}
          />
        </View>
      ) : null}
    </View>
  );
}

function AcceptedCall(props: { time: string }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={[styles.block, { backgroundColor: CALL_COLOR }]}>
      <Text style={styles.blockTitle}>{t('client.calendar.detail.callScheduled')}</Text>
      <Text style={styles.blockText}>{t('client.calendar.detail.callWith', { time: props.time })}</Text>
    </View>
  );
}

function CallRequest(props: { dateStr: string }): React.JSX.Element {
  const { t } = useTranslation();
  const [time, setTime] = useState('17:15');
  const [sent, setSent] = useState(false);
  const propose = useCreateCallProposalMutation();
  return (
    <View style={[styles.block, { backgroundColor: CALL_REQUEST_COLOR }]}>
      <Text style={styles.blockTitle}>{t('client.calendar.detail.scheduleCall')}</Text>
      <View style={styles.chips}>
        {QUICK_CALL_TIMES.map((option) => (
          <Pressable key={option} onPress={() => setTime(option)} style={styles.chip}>
            <Text style={styles.chipText}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <CallTimeSelect onChange={setTime} value={time} />
      <ActionButton
        label={t('client.calendar.detail.sendToCoach')}
        onPress={() => propose.mutate({ date: props.dateStr, time }, { onSuccess: () => setSent(true) })}
      />
      {sent ? <Text style={styles.blockText}>{t('client.calendar.detail.callSent', { time })}</Text> : null}
    </View>
  );
}

function ActionButton(props: { label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={styles.blockButton}>
      <Text style={styles.blockButtonText}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: 12, marginTop: 10, padding: 12 },
  blockButton: { backgroundColor: '#ffffff22', borderRadius: 10, marginTop: 8, paddingVertical: 8 },
  blockButtonText: { color: TEXT_LIGHT, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  blockText: { color: TEXT_LIGHT, fontSize: 13, marginTop: 4 },
  blockTitle: { color: TEXT_LIGHT, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  chip: { backgroundColor: '#ffffff22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipText: { color: TEXT_LIGHT, fontSize: 12 },
});

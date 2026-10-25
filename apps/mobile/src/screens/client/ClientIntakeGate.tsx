import React, { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, TextField } from '@trainerpro/ui';
import { createApiClient } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';

type Intake = { status: 'COMPLETED' | 'PENDING' } | null;

export function ClientIntakeGate(): React.JSX.Element | null {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const status = useAuthStore((state) => state.status);
  const [step, setStep] = useState(0);
  const [parqYes, setParqYes] = useState(false);
  const [injuries, setInjuries] = useState('');
  const [allergies, setAllergies] = useState('');
  const query = useQuery({
    enabled: status === 'signedIn' && Boolean(accessToken),
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<Intake>('/clients/me/intake'),
    queryKey: ['client', 'intake', accessToken],
  });
  if (query.data?.status !== 'PENDING') return null;
  const save = async (complete: boolean) => {
    const answers = {
      allergies,
      injuries,
      parq: {
        bloodPressure: false,
        bone: false,
        chestPain: false,
        dizziness: false,
        heart: parqYes,
        otherReason: false,
        supervision: false,
      },
    };
    const path = complete ? '/clients/me/intake/complete' : '/clients/me/intake';
    await createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).post(path, answers);
    if (complete) await query.refetch();
  };
  return (
    <Modal animationType={'slide'} visible>
      <View style={{ gap: 12, padding: 24 }}>
        <Text>{t('mobile.client.intake.title')}</Text>
        {step === 0 ? <ParqStep parqYes={parqYes} setParqYes={setParqYes} t={t} /> : null}
        {step === 1 ? (
          <TextField label={t('mobile.client.intake.injuries')} onChangeText={setInjuries} value={injuries} />
        ) : null}
        {step === 2 ? (
          <TextField label={t('mobile.client.intake.allergies')} onChangeText={setAllergies} value={allergies} />
        ) : null}
        <Button
          label={step < 2 ? t('mobile.client.intake.next') : t('mobile.client.intake.finish')}
          onPress={() => {
            if (step < 2) {
              void save(false);
              setStep(step + 1);
              return;
            }
            void save(true);
          }}
        />
      </View>
    </Modal>
  );
}

function ParqStep(props: {
  parqYes: boolean;
  setParqYes: (value: boolean) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={{ gap: 8 }}>
      <Text>{props.t('mobile.client.intake.parq')}</Text>
      <Button
        label={props.t('mobile.client.intake.yes')}
        onPress={() => props.setParqYes(true)}
        variant={props.parqYes ? 'primary' : 'secondary'}
      />
      <Button
        label={props.t('mobile.client.intake.no')}
        onPress={() => props.setParqYes(false)}
        variant={props.parqYes ? 'secondary' : 'primary'}
      />
    </View>
  );
}

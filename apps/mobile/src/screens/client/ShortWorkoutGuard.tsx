import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../../theme/ConfirmModal';

const DANGER_TONE = 'danger' as const;

export type ShortWorkoutStep = 'mistake' | 'register';

type Props = {
  busy: boolean;
  onBack: () => void;
  onConfirmMistake: () => void;
  onDecline: () => void;
  onRegister: () => void;
  step: ShortWorkoutStep | null;
};

export function ShortWorkoutGuard(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  if (props.step === 'mistake') {
    return (
      <ConfirmModal
        cancelLabel={t('mobile.client.session.shortBack')}
        confirmLabel={t('mobile.client.session.shortConfirm')}
        confirmTone={DANGER_TONE}
        message={t('mobile.client.session.shortMistakeMessage')}
        title={t('mobile.client.session.shortMistakeTitle')}
        visible
        onCancel={props.busy ? noop : props.onBack}
        onConfirm={props.busy ? noop : props.onConfirmMistake}
      />
    );
  }
  return (
    <ConfirmModal
      cancelLabel={t('mobile.client.session.shortNo')}
      confirmLabel={t('mobile.client.session.shortYes')}
      message={t('mobile.client.session.shortRegisterMessage')}
      title={t('mobile.client.session.shortRegisterTitle')}
      visible={props.step === 'register'}
      onCancel={props.onDecline}
      onConfirm={props.onRegister}
    />
  );
}

function noop(): void {
  return undefined;
}

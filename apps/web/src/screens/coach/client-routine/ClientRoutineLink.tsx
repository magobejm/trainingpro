import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '@trainerpro/ui';
import { clientPath } from '../../../layout/shell-routes';

/** Entry point to the client's own copy of the routine, week by week. */
export function ClientRoutineLink({ clientId }: { clientId: string }): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Button
      label={t('coach.clientRoutine.open')}
      onPress={() => navigate(clientPath(clientId, 'training'))}
      variant="secondary"
    />
  );
}

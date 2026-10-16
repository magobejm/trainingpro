import React from 'react';
import type { ClientListResponse } from '@trainerpro/shared';
import { useTranslation } from 'react-i18next';
import { useCoachQuery } from '../../data/hooks/useCoachData';
import { CoachSelect, CoachStatus } from './CoachUi';
import { CoachClientCardsPicker } from './CoachClientCardsPicker';
export function CoachClientPicker({
  value,
  onChange,
  optional = false,
  cards = false,
}: {
  value: string;
  onChange: (id: string) => void;
  optional?: boolean;
  cards?: boolean;
}) {
  const { t } = useTranslation();
  const query = useCoachQuery<ClientListResponse>('/clients');
  const client = query.data?.items.find((item) => item.id === value);
  if (cards)
    return (
      <>
        <CoachStatus query={query} />
        <CoachClientCardsPicker
          optional={optional}
          onChange={onChange}
          label={
            client
              ? [client.firstName, client.lastName].join(' ')
              : t(optional ? 'coachWorkspace.allClients' : 'coachWorkspace.chooseClient')
          }
        />
      </>
    );
  return (
    <>
      <CoachStatus query={query} />
      <CoachSelect
        label={t('coachWorkspace.client')}
        value={value}
        onChange={onChange}
        options={[
          { value: '', label: t(optional ? 'coachWorkspace.allClients' : 'coachWorkspace.chooseClient') },
          ...(query.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` })),
        ]}
      />
    </>
  );
}

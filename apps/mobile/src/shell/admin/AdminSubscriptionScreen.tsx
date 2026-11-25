import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CoachButton, CoachField, CoachPage, CoachStatus, ui } from '../../features/coach/CoachUi';
import {
  useBillingEstimateQuery,
  useOrgOccupancyQuery,
  useUpdateClientLimitMutation,
} from '../../data/hooks/useOrgSubscription';
import { useLogout } from '../../data/hooks/useAuthMutations';
import { PasswordChangeForm } from '../../screens/auth/PasswordChangeForm';

export function AdminSubscriptionScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const logout = useLogout();
  return (
    <CoachPage title={t('mobile.admin.subscription.title')}>
      <OccupancyCard />
      <BillingCard />
      <PasswordChangeForm />
      <CoachButton danger label={t('mobile.admin.logout')} onPress={logout} />
    </CoachPage>
  );
}

function OccupancyCard(): React.JSX.Element {
  const { t } = useTranslation();
  const query = useOrgOccupancyQuery();
  const update = useUpdateClientLimitMutation();
  const [value, setValue] = React.useState('');
  const parsed = Number(value);
  const valid = value.trim() !== '' && Number.isInteger(parsed) && parsed >= 0;
  return (
    <View style={ui.card}>
      <CoachStatus query={query} />
      {query.data ? (
        <>
          <Text style={ui.label}>{t('mobile.admin.subscription.current', { count: query.data.activeClientCount })}</Text>
          <Text style={ui.label}>{t('mobile.admin.subscription.limit', { count: query.data.clientLimit })}</Text>
        </>
      ) : null}
      <CoachField label={t('mobile.admin.subscription.newLimit')} numeric onChange={setValue} value={value} />
      {value.trim() !== '' && !valid ? <Text style={ui.error}>{t('mobile.admin.subscription.invalid')}</Text> : null}
      <CoachButton
        disabled={!valid}
        label={t('mobile.admin.subscription.save')}
        loading={update.isPending}
        onPress={() => update.mutate(parsed, { onSuccess: () => setValue('') })}
      />
      {update.isSuccess ? <Text style={ui.muted}>{t('mobile.admin.subscription.saved')}</Text> : null}
      {update.isError ? <Text style={ui.error}>{t('mobile.admin.coaches.error')}</Text> : null}
    </View>
  );
}

function BillingCard(): React.JSX.Element {
  const { t } = useTranslation();
  const query = useBillingEstimateQuery();
  const billing = query.data;
  const empty = '—';
  return (
    <View style={ui.card}>
      <CoachStatus query={query} />
      <Text style={ui.label}>{t('mobile.admin.billing.title')}</Text>
      <Text style={ui.muted}>
        {billing
          ? t('mobile.admin.billing.estimate', { count: billing.clientLimit, price: billing.estimatedMonthly })
          : empty}
      </Text>
      <Text style={ui.muted}>
        {billing
          ? t('mobile.admin.billing.billable', { count: billing.activeClients, price: billing.billableMonthly })
          : empty}
      </Text>
    </View>
  );
}

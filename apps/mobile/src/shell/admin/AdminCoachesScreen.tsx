import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CoachButton, CoachField, CoachPage, CoachStatus, confirmCoachDelete, ui } from '../../features/coach/CoachUi';
import { LIGHT } from '../../theme/light';
import { useCoachActionMutation, useCreateCoachMutation, type CoachAction } from '../../data/hooks/useCoachMutations';
import { useCoachesQuery, type CoachView } from '../../data/hooks/useCoachesQuery';
import { useCoachMetricsQuery } from '../../data/hooks/useOrgSubscription';

export function AdminCoachesScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const [archived, setArchived] = React.useState(false);
  const query = useCoachesQuery(archived);
  const action = useCoachActionMutation();
  const run = (coach: CoachView, next: CoachAction): void => {
    const go = (): void => action.mutate({ action: next, coachMembershipId: coach.coachMembershipId });
    if (next === 'archive') {
      confirmCoachDelete(coach.email, go, (key) => t(key));
    } else {
      go();
    }
  };
  return (
    <CoachPage title={t('mobile.admin.coaches.title')}>
      <CreateCoachCard />
      <View style={ui.row}>
        <CoachButton disabled={!archived} label={t('mobile.admin.coaches.active')} onPress={() => setArchived(false)} />
        <CoachButton disabled={archived} label={t('mobile.admin.coaches.archived')} onPress={() => setArchived(true)} />
      </View>
      <CoachStatus empty={query.data?.length === 0} query={query} />
      {action.isError ? <Text style={ui.error}>{t('mobile.admin.coaches.error')}</Text> : null}
      {query.data?.map((coach) => (
        <CoachCard coach={coach} key={coach.coachMembershipId} onAction={run} />
      ))}
      <CoachMetrics />
    </CoachPage>
  );
}

function CreateCoachCard(): React.JSX.Element {
  const { t } = useTranslation();
  const [email, setEmail] = React.useState('');
  const create = useCreateCoachMutation();
  const [copied, setCopied] = React.useState(false);
  const password = create.data?.credentials.temporaryPassword ?? null;
  const submit = (): void => {
    setCopied(false);
    create.mutate(email.trim(), { onSuccess: () => setEmail('') });
  };
  const copy = (): void => {
    const nav = globalThis as { navigator?: { clipboard?: { writeText: (text: string) => Promise<void> } } };
    if (password && nav.navigator?.clipboard) {
      void nav.navigator.clipboard.writeText(password).then(() => setCopied(true));
    }
  };
  return (
    <View style={ui.card}>
      <CoachField label={t('mobile.admin.coaches.email')} onChange={setEmail} value={email} />
      <CoachButton
        disabled={!email.trim()}
        label={t('mobile.admin.coaches.create')}
        loading={create.isPending}
        onPress={submit}
      />
      {create.isError ? <Text style={ui.error}>{t('mobile.admin.coaches.error')}</Text> : null}
      {create.isSuccess ? <Text style={ui.label}>{t('mobile.admin.coaches.created')}</Text> : null}
      {password ? (
        <View style={styles.password}>
          <Text selectable style={ui.label}>
            {t('mobile.admin.coaches.tempPassword', { password })}
          </Text>
          <CoachButton label={t('mobile.admin.coaches.copyPassword')} onPress={copy} />
          {copied ? <Text style={ui.muted}>{t('mobile.admin.coaches.copied')}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

type CoachCardProps = { coach: CoachView; onAction: (coach: CoachView, action: CoachAction) => void };

function CoachCard(props: CoachCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const { coach } = props;
  const archived = coach.archivedAt !== null;
  const status = coach.isActive ? t('mobile.admin.coaches.statusActive') : t('mobile.admin.coaches.statusInactive');
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{coach.email}</Text>
      {archived ? null : <Text style={ui.muted}>{status}</Text>}
      <View style={ui.row}>
        {archived ? (
          <CoachButton label={t('mobile.admin.coaches.restore')} onPress={() => props.onAction(coach, 'restore')} />
        ) : (
          <>
            <CoachButton
              label={coach.isActive ? t('mobile.admin.coaches.deactivate') : t('mobile.admin.coaches.activate')}
              onPress={() => props.onAction(coach, coach.isActive ? 'deactivate' : 'activate')}
            />
            <CoachButton danger label={t('mobile.admin.coaches.archive')} onPress={() => props.onAction(coach, 'archive')} />
          </>
        )}
      </View>
    </View>
  );
}

function CoachMetrics(): React.JSX.Element | null {
  const { t } = useTranslation();
  const query = useCoachMetricsQuery();
  const coaches = query.data?.coaches ?? [];
  if (coaches.length === 0) {
    return null;
  }
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{t('mobile.admin.metrics.title')}</Text>
      {coaches.map((coach) => (
        <Text key={coach.coachEmail} style={ui.muted}>
          {t('mobile.admin.metrics.row', {
            active: coach.activeClients ?? t('mobile.admin.metrics.hidden'),
            adherence: coach.adherencePercent === null ? '—' : `${coach.adherencePercent}%`,
            email: coach.coachEmail,
          })}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  password: { backgroundColor: LIGHT.bgSoft, borderRadius: LIGHT.radiusSm, gap: 8, padding: 12 },
});

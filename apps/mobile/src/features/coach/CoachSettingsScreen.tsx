import React, { useEffect, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CoachAccountForm } from './CoachAccountForm';
import { useTranslation } from 'react-i18next';
import { useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { useLogout } from '../../data/hooks/useAuthMutations';
import type { NotificationPreference } from '../../data/hooks/useNotificationPreferences';
import { useAuthStore } from '../../store/auth.store';
import { getSupabaseClient } from '../../data/supabase-client';
import { CoachButton, CoachPage, CoachSelect, CoachStatus, ui } from './CoachUi';

export function CoachPreferencesScreen() {
  const { t } = useTranslation();
  const query = useCoachQuery<NotificationPreference[]>('/notifications/preferences');
  const write = useCoachWrite();
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web')
      void import('expo-notifications')
        .then(async (mod) => {
          const permission = await mod.getPermissionsAsync();
          setDenied(!permission.granted);
        })
        .catch(() => undefined);
  }, []);
  const topics = ['SESSION_COMPLETED', 'INCIDENT_CRITICAL', 'CLIENT_INACTIVE_3D', 'ADHERENCE_LOW_WEEKLY', 'CLIENT_REMINDER'];
  return (
    <CoachPage title={t('coachWorkspace.preferences')}>
      <CoachStatus query={query} />
      {denied ? (
        <View style={ui.card}>
          <Text style={ui.text}>{t('coach.notifications.permissionDenied')}</Text>
          <CoachButton label={t('coach.notifications.openSettings')} onPress={() => void Linking.openSettings()} />
        </View>
      ) : null}
      {topics.map((topic) => (
        <View key={topic} style={ui.card}>
          <Text style={ui.label}>{t('coach.notifications.topic.' + topic.toLowerCase())}</Text>
          <CoachSelect
            label={t('coachWorkspace.status')}
            value={query.data?.find((p) => p.topic === topic)?.enabled ? 'yes' : 'no'}
            onChange={(next) => {
              if (!write.isPending)
                write.mutate({ path: '/notifications/preferences', body: { topic, enabled: next === 'yes' } });
            }}
            options={[
              { value: 'yes', label: t('coachWorkspace.yes') },
              { value: 'no', label: t('coachWorkspace.no') },
            ]}
          />
        </View>
      ))}
    </CoachPage>
  );
}
export function CoachAccountScreen() {
  const { t, i18n } = useTranslation();
  const logout = useLogout();
  const userId = useAuthStore((s) => s.userId);
  const roles = useAuthStore((s) => s.availableRoles);
  const setRole = useAuthStore((s) => s.setActiveRole);
  const query = useQuery({
    queryKey: ['coach', userId, 'coach', 'account-profile'],
    enabled: !!userId,
    queryFn: async () => {
      const result = await getSupabaseClient().auth.getUser();
      if (result.error) throw result.error;
      if (!result.data.user || result.data.user.id !== userId) throw new Error(t('coachWorkspace.sessionRequired'));
      return result.data.user;
    },
  });
  return (
    <CoachPage title={t('coachWorkspace.account')}>
      <CoachStatus query={query} />
      {query.data ? (
        <CoachAccountForm
          key={JSON.stringify([query.data.email, query.data.user_metadata])}
          user={query.data}
          onSaved={() => void query.refetch()}
        />
      ) : null}
      <CoachSelect
        label={t('coachWorkspace.language')}
        value={i18n.language.startsWith('en') ? 'en' : 'es'}
        onChange={(language) => void i18n.changeLanguage(language)}
        options={[
          { value: 'es', label: 'Español' },
          { value: 'en', label: 'English' },
        ]}
      />
      {roles.includes('client') ? (
        <CoachButton label={t('coachWorkspace.switchClient')} onPress={() => setRole('client')} />
      ) : null}
      <CoachButton label={t('mobile.shell.logout')} onPress={logout} danger />
    </CoachPage>
  );
}

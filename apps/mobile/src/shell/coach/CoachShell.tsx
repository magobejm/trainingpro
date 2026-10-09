import React from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLogout } from '../../data/hooks/useAuthMutations';
import type { NotificationTarget } from '../../data/notification-routing';
import { useNotificationTargetStore } from '../../store/notification-target.store';
import { CoachIncidentDetailScreen } from '../../screens/coach/CoachIncidentDetailScreen';
import { CoachSessionDetailScreen } from '../../screens/coach/CoachSessionDetailScreen';
import { NotificationSettingsScreen } from '../../screens/coach/NotificationSettingsScreen';
import { ChatScreen } from '../../screens/shared/ChatScreen';

type CoachRouteId = 'coach.chat' | 'coach.notifications';
type CoachOverlay = Exclude<NotificationTarget, { kind: 'client-session' }>;

export function CoachShell(): React.JSX.Element {
  const { t } = useTranslation();
  const logout = useLogout();
  const [route, setRoute] = React.useState<CoachRouteId>('coach.notifications');
  const target = useNotificationTargetStore((state) => state.target);
  const clear = useNotificationTargetStore((state) => state.clear);
  const overlay = coachOverlay(target);
  useCoachBack(overlay, clear);
  if (overlay) {
    return (
      <View style={styles.page}>
        <Pressable onPress={clear} style={styles.back}>
          <Text style={styles.backLabel}>{t('coach.notice.back')}</Text>
        </Pressable>
        <View style={styles.body}>{renderOverlay(overlay)}</View>
      </View>
    );
  }
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('app.title')}</Text>
        <Pressable onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutLabel}>{t('mobile.shell.logout')}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.tabs} horizontal showsHorizontalScrollIndicator={false}>
        {buildCoachRoutes(t).map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setRoute(item.id)}
            style={[styles.tab, route === item.id ? styles.tabActive : null]}
          >
            <Text style={[styles.tabLabel, route === item.id ? styles.tabLabelActive : null]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.body}>{route === 'coach.notifications' ? <NotificationSettingsScreen /> : <ChatScreen />}</View>
    </View>
  );
}

function useCoachBack(overlay: CoachOverlay | null, clear: () => void): void {
  React.useEffect(() => {
    if (!overlay) {
      return undefined;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      clear();
      return true;
    });
    return () => subscription.remove();
  }, [clear, overlay]);
}

function coachOverlay(target: NotificationTarget | null): CoachOverlay | null {
  if (!target || target.kind === 'client-session') {
    return null;
  }
  return target;
}

function renderOverlay(overlay: CoachOverlay): React.JSX.Element {
  if (overlay.kind === 'coach-session') {
    return <CoachSessionDetailScreen sessionId={overlay.sessionId} />;
  }
  if (overlay.kind === 'coach-incident') {
    return <CoachIncidentDetailScreen incidentId={overlay.incidentId} />;
  }
  return <ChatScreen clientId={overlay.clientId} />;
}

function buildCoachRoutes(t: (key: string) => string): { id: CoachRouteId; label: string }[] {
  return [
    { id: 'coach.notifications', label: t('mobile.tab.notifications') },
    { id: 'coach.chat', label: t('mobile.tab.chat') },
  ];
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: 12, paddingTop: 12 },
  backLabel: { color: '#ec4899', fontSize: 14, fontWeight: '800' },
  body: { flex: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(236,72,153,0.2)',
    borderColor: 'rgba(236,72,153,0.4)',
    borderRadius: 9,
    borderWidth: 1,
    minHeight: 34,
    minWidth: 92,
    paddingHorizontal: 10,
  },
  logoutLabel: { color: '#ec4899', fontSize: 12, fontWeight: '800', lineHeight: 34 },
  page: { backgroundColor: '#07000f', flex: 1 },
  tab: { backgroundColor: 'rgba(109,40,217,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  tabActive: { backgroundColor: '#ec4899' },
  tabLabel: { color: 'rgba(196,181,253,0.8)', fontSize: 12, fontWeight: '700' },
  tabLabelActive: { color: '#ffffff' },
  tabs: { gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
});

import { ToastProvider } from '@trainerpro/ui';
import React from 'react';
import {
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type { ClientView } from '@trainerpro/shared';
import { useCoachQuery } from '../../data/hooks/useCoachData';
import { useLogout } from '../../data/hooks/useAuthMutations';
import { useNotificationTargetStore } from '../../store/notification-target.store';
import { useAuthStore } from '../../store/auth.store';
import { CoachIncidentView } from '../../features/coach/CoachIncidentsScreen';
import { CoachSessionView } from '../../features/coach/CoachProgressScreen';
import { CoachHomeScreen } from '../../screens/coach/CoachHomeScreen';
import { CoachClientsScreen } from '../../screens/coach/CoachClientsScreen';
import { ClientProfileScreen, CoachClientCreateScreen } from '../../screens/coach/ClientProfileScreen';
import { useCoachCopy, type CoachCopyKey } from '../../screens/coach/coach-copy';
import { ChatScreen } from '../../screens/shared/ChatScreen';
import { CoachFeatureScreen } from '../../features/coach/CoachFeatureScreen';
import { CoachPage, CoachButton } from '../../features/coach/CoachUi';
import { BottomNav, BackHeader } from '../../theme/primitives';
import { LIGHT } from '../../theme/light';
import {
  backCoachRoute,
  backCoachRouteIfCurrent,
  coachNotificationRoute,
  initialCoachNavigation,
  openCoachRoute,
  selectCoachTab,
  type CoachRoute,
  type CoachTab,
} from './coach-navigation';

export function CoachShell(): React.JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const c = useCoachCopy();
  return (
    <ToastProvider dismissLabel={c('dismiss')}>
      <CoachWorkspace key={userId ?? 'signed-out'} />
    </ToastProvider>
  );
}
function CoachWorkspace(): React.JSX.Element {
  const c = useCoachCopy();
  const [navigation, setNavigation] = React.useState(initialCoachNavigation);
  const target = useNotificationTargetStore((state) => state.target);
  const clear = useNotificationTargetStore((state) => state.clear);
  const route = navigation.stack[navigation.stack.length - 1];
  const fade = useCoachTransition(navigation.tab, navigation.stack.length);
  const open = React.useCallback((next: CoachRoute) => setNavigation((current) => openCoachRoute(current, next)), []);
  const back = React.useCallback(() => setNavigation(backCoachRoute), []);
  const onOpen = React.useCallback(
    (feature: string, clientId?: string) => open({ kind: 'feature', feature, clientId }),
    [open],
  );
  React.useEffect(() => {
    const next = coachNotificationRoute(target);
    if (next) {
      open(next);
      clear();
    }
  }, [clear, open, target]);
  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigation.stack.length) {
        back();
        return true;
      }
      if (navigation.tab !== 'home') {
        setNavigation((current) => selectCoachTab(current, 'home'));
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [back, navigation]);
  const select = (tab: CoachTab) => setNavigation((current) => selectCoachTab(current, tab));
  const body =
    navigation.tab === 'home' ? (
      <CoachHomeScreen
        onOpen={onOpen}
        onClients={() => select('clients')}
        onCreate={() => open({ kind: 'client-create' })}
      />
    ) : navigation.tab === 'clients' ? (
      <CoachClientsScreen
        onSelect={(clientId) => open({ kind: 'client', clientId })}
        onCreate={() => open({ kind: 'client-create' })}
      />
    ) : navigation.tab === 'chat' ? (
      <CoachClientsScreen selecting onSelect={(clientId) => open({ kind: 'chat', clientId })} />
    ) : navigation.tab === 'calendar' ? (
      <CoachFeatureScreen feature={'calendar'} onOpen={onOpen} />
    ) : (
      <CoachMore onOpen={onOpen} />
    );
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {route ? <BackHeader title={c('back')} onBack={back} /> : null}
        <Animated.View style={[styles.body, { opacity: fade }]}>
          <View style={[styles.body, route && styles.hidden]}>{body}</View>
          {navigation.stack.map((entry, index) => (
            <View
              key={index + JSON.stringify(entry)}
              style={[styles.body, index !== navigation.stack.length - 1 && styles.hidden]}
            >
              <CoachDetail
                route={entry}
                open={open}
                onOpen={onOpen}
                back={() => setNavigation((current) => backCoachRouteIfCurrent(current, entry))}
              />
            </View>
          ))}
        </Animated.View>
        {!route ? (
          <BottomNav<CoachTab>
            active={navigation.tab}
            onChange={select}
            labels={{
              home: c('home'),
              clients: c('clients'),
              calendar: c('calendar'),
              chat: c('chat'),
              more: c('more'),
            }}
            items={[
              { id: 'home', icon: <Text style={styles.icon}>{'⌂'}</Text> },
              { id: 'clients', icon: <Text style={styles.icon}>{'♧'}</Text> },
              { id: 'calendar', icon: <Text style={styles.icon}>{'▦'}</Text> },
              { id: 'chat', icon: <Text style={styles.icon}>{'☏'}</Text> },
              { id: 'more', icon: <Text style={styles.icon}>{'☰'}</Text> },
            ]}
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function useCoachTransition(tab: CoachTab, depth: number) {
  const fade = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }).start();
  }, [fade, tab, depth]);
  return fade;
}
function CoachDetail(props: {
  route: CoachRoute;
  open: (route: CoachRoute) => void;
  onOpen: (feature: string, clientId?: string) => void;
  back: () => void;
}) {
  const route = props.route;
  if (route.kind === 'client')
    return (
      <ClientProfileScreen
        clientId={route.clientId}
        onOpen={props.onOpen}
        onChat={(clientId) => props.open({ kind: 'chat', clientId })}
        onArchived={props.back}
      />
    );
  if (route.kind === 'client-create')
    return <CoachClientCreateScreen onCreated={(clientId) => props.open({ kind: 'client', clientId })} />;
  if (route.kind === 'chat') return <CoachChat clientId={route.clientId} />;
  if (route.kind === 'session') return <CoachSessionView sessionId={route.sessionId} />;
  if (route.kind === 'incident') return <CoachIncidentView incidentId={route.incidentId} onBack={props.back} />;
  return <CoachFeatureScreen feature={route.feature} clientId={route.clientId} onOpen={props.onOpen} />;
}
function CoachChat({ clientId }: { clientId: string }) {
  const client = useCoachQuery<ClientView>('/clients/' + clientId);
  return (
    <ChatScreen
      clientId={clientId}
      interlocutorName={client.data ? [client.data.firstName, client.data.lastName].join(' ') : undefined}
    />
  );
}
function CoachMore(props: { onOpen: (feature: string, clientId?: string) => void }) {
  const c = useCoachCopy();
  const logout = useLogout();
  return (
    <CoachPage title={c('more')}>
      {(
        [
          'routines',
          'warmups',
          'library',
          'nutrition',
          'notes',
          'incidents',
          'evaluator',
          'preferences',
          'account',
        ] as CoachCopyKey[]
      ).map((feature) => (
        <CoachButton key={feature} label={c(feature)} onPress={() => props.onOpen(feature)} />
      ))}
      <CoachButton danger label={c('logout')} onPress={logout} />
    </CoachPage>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LIGHT.bgSoft,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  hidden: { display: 'none' },
  body: { flex: 1, minHeight: 0 },
  icon: { color: LIGHT.accent, fontSize: 24 },
});

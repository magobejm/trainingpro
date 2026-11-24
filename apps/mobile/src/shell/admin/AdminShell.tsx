import { ToastProvider } from '@trainerpro/ui';
import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth.store';
import { BottomNav } from '../../theme/primitives';
import { LIGHT } from '../../theme/light';
import { AdminCoachesScreen } from './AdminCoachesScreen';
import { AdminSubscriptionScreen } from './AdminSubscriptionScreen';

type AdminTab = 'coaches' | 'subscription';

export function AdminShell(): React.JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  return (
    <ToastProvider dismissLabel={'×'}>
      <AdminWorkspace key={userId ?? 'signed-out'} />
    </ToastProvider>
  );
}

function AdminWorkspace(): React.JSX.Element {
  const { t } = useTranslation();
  const [tab, setTab] = React.useState<AdminTab>('coaches');
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>{tab === 'coaches' ? <AdminCoachesScreen /> : <AdminSubscriptionScreen />}</View>
      <BottomNav<AdminTab>
        active={tab}
        items={[
          { icon: <Text style={styles.icon}>{'♧'}</Text>, id: 'coaches' },
          { icon: <Text style={styles.icon}>{'▦'}</Text>, id: 'subscription' },
        ]}
        labels={{ coaches: t('mobile.admin.tab.coaches'), subscription: t('mobile.admin.tab.subscription') }}
        onChange={setTab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, minHeight: 0 },
  icon: { color: LIGHT.accent, fontSize: 24 },
  root: {
    backgroundColor: LIGHT.bgSoft,
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
});

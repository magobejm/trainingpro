import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../clients-screen.styles';

type Props = {
  onBack: () => void;
  onOpenProfile: () => void;
  selectedClientEmail: string;
  selectedClientName: string;
  selectedObjective: null | string;
  t: (key: string) => string;
};

export function ClientManagementPanel(props: Props): React.JSX.Element {
  return (
    <>
      <View style={styles.breadcrumbCard}>
        <Pressable onPress={props.onBack} style={styles.backButton}>
          <Text style={styles.backLabel}>{props.t('common.back')}</Text>
        </Pressable>
        <Text style={styles.breadcrumb}>
          {buildBreadcrumb(props.t('coach.clients.title'), props.selectedClientName)}
        </Text>
      </View>
      <View style={styles.managementCard}>
        <Text style={styles.managementTitle}>{props.t('coach.clientManagement.title')}</Text>
        <Text style={styles.managementSubtitle}>{props.selectedClientEmail}</Text>
        <View style={styles.managementSummary}>
          <Text style={styles.managementSummaryText}>{props.selectedClientName}</Text>
          <Text style={styles.managementSummaryText}>{props.selectedObjective ?? ''}</Text>
        </View>
        <Pressable onPress={props.onOpenProfile} style={styles.managementButton}>
          <Text style={styles.managementButtonLabel}>
            {props.t('coach.clientManagement.openProfile')}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

function buildBreadcrumb(parent: string, current: string): string {
  return [parent, current].filter((item) => item.trim().length > 0).join(' / ');
}

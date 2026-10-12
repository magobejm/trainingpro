import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '@trainerpro/ui';
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
        <Button label={props.t('common.back')} onPress={props.onBack} size="sm" variant="secondary" />
        <Text style={styles.breadcrumb}>{buildBreadcrumb(props.t('coach.clients.title'), props.selectedClientName)}</Text>
      </View>
      <View style={styles.managementCard}>
        <Text style={styles.managementTitle}>{props.t('coach.clientManagement.title')}</Text>
        <Text style={styles.managementSubtitle}>{props.selectedClientEmail}</Text>
        <View style={styles.managementSummary}>
          <Text style={styles.managementSummaryText}>{props.selectedClientName}</Text>
          <Text style={styles.managementSummaryText}>{props.selectedObjective ?? ''}</Text>
        </View>
        <Button
          label={props.t('coach.clientManagement.openProfile')}
          onPress={props.onOpenProfile}
          style={styles.managementButton}
        />
      </View>
    </>
  );
}

function buildBreadcrumb(parent: string, current: string): string {
  return [parent, current].filter((item) => item.trim().length > 0).join(' / ');
}

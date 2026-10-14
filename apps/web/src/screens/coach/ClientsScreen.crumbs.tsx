import React from 'react';
import { View } from 'react-native';
import { Button } from '@trainerpro/ui';
import { Breadcrumbs } from '../../layout/Breadcrumbs';
import { buildClientCrumbs, type ClientCrumbMode } from '../../layout/crumbs';
import { styles } from './clients-screen.styles';
import type { ViewProps } from './ClientsScreen';

export function CrumbBar(props: { mode: ClientCrumbMode; onBack: () => void; view: ViewProps }): React.JSX.Element {
  const { t } = props.view;
  const crumbs = buildClientCrumbs({
    clientId: props.view.selectedClientId,
    clientName: props.view.selectedClientName,
    mode: props.mode,
    t,
  });
  return (
    <View style={styles.breadcrumbCard}>
      <Button label={t('common.back')} onPress={props.onBack} size="sm" variant="secondary" />
      <Breadcrumbs accessibilityLabel={t('app.breadcrumb')} crumbs={crumbs} />
    </View>
  );
}

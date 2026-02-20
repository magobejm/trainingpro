import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../ClientProfileScreen.styles';

type Props = {
  t: (key: string) => string;
};

type KpiItem = {
  id: string;
  titleKey: string;
  valueKey: string;
};

const KPI_ITEMS: KpiItem[] = [
  {
    id: 'last-session',
    titleKey: 'coach.clientProfile.kpis.lastSession.title',
    valueKey: 'coach.clientProfile.kpis.lastSession.mockValue',
  },
  {
    id: 'streak',
    titleKey: 'coach.clientProfile.kpis.streak.title',
    valueKey: 'coach.clientProfile.kpis.streak.mockValue',
  },
  {
    id: 'adherence',
    titleKey: 'coach.clientProfile.kpis.adherence.title',
    valueKey: 'coach.clientProfile.kpis.adherence.mockValue',
  },
];

export function ClientProfileKpiCards(props: Props): React.JSX.Element {
  return (
    <View style={styles.kpiCardsRow}>
      {KPI_ITEMS.map((item) => (
        <KpiCard item={item} key={item.id} t={props.t} />
      ))}
    </View>
  );
}

function KpiCard(props: { item: KpiItem; t: Props['t'] }): React.JSX.Element {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiCardTitle}>{props.t(props.item.titleKey)}</Text>
      <Text style={styles.kpiCardValue}>{props.t(props.item.valueKey)}</Text>
    </View>
  );
}

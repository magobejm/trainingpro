import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../ClientProfileScreen.styles';

type DetailItem = {
  actionKey?: string;
  emptyKey: string;
  icon: string;
  id: string;
  titleKey: string;
};

const DETAILS: DetailItem[] = [
  {
    actionKey: 'coach.clientProfile.details.trainingPlan.action',
    emptyKey: 'coach.clientProfile.details.trainingPlan.empty',
    icon: '🏋️',
    id: 'training',
    titleKey: 'coach.clientProfile.details.trainingPlan.title',
  },
  {
    actionKey: 'coach.clientProfile.details.nutritionPlan.action',
    emptyKey: 'coach.clientProfile.details.nutritionPlan.empty',
    icon: '🥗',
    id: 'nutrition',
    titleKey: 'coach.clientProfile.details.nutritionPlan.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.mood.empty',
    icon: '🙂',
    id: 'mood',
    titleKey: 'coach.clientProfile.details.mood.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.weeklyVolume.empty',
    icon: '📊',
    id: 'volume',
    titleKey: 'coach.clientProfile.details.weeklyVolume.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.progress.empty',
    icon: '📈',
    id: 'progress',
    titleKey: 'coach.clientProfile.details.progress.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.incidents.empty',
    icon: '⚠️',
    id: 'incidents',
    titleKey: 'coach.clientProfile.details.incidents.title',
  },
  {
    emptyKey: 'coach.clientProfile.details.chat.empty',
    icon: '💬',
    id: 'chat',
    titleKey: 'coach.clientProfile.details.chat.title',
  },
];

type Props = {
  t: (key: string) => string;
};

export function ClientProfileDetailsList(props: Props): React.JSX.Element {
  return (
    <View style={styles.detailsWrap}>
      {DETAILS.map((item) => (
        <DetailCard item={item} key={item.id} t={props.t} />
      ))}
    </View>
  );
}

function DetailCard(props: {
  item: DetailItem;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <Pressable style={styles.detailCard}>
      <View style={styles.detailLeft}>
        <View style={styles.detailIcon}>
          <Text style={styles.detailIconLabel}>{props.item.icon}</Text>
        </View>
        <View style={styles.detailText}>
          <Text style={styles.detailTitle}>{props.t(props.item.titleKey)}</Text>
          <Text style={styles.detailSubtitle}>{props.t(props.item.emptyKey)}</Text>
        </View>
      </View>
      {props.item.actionKey ? <ActionButton label={props.t(props.item.actionKey)} /> : <Arrow />}
    </Pressable>
  );
}

function ActionButton(props: { label: string }): React.JSX.Element {
  return (
    <Pressable style={styles.assignButton}>
      <Text style={styles.assignLabel}>{props.label}</Text>
    </Pressable>
  );
}

function Arrow(): React.JSX.Element {
  return <Text style={styles.arrow}>{'>'}</Text>;
}

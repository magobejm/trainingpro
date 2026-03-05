import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../ClientProfileScreen.styles';

type Props = {
  t: (key: string) => string;
  trainingPlan?: { id: string; name: string };
  onOpenPlanner: () => void;
  onUnassign: () => void;
};

const PLAN_ICON = '🏋️';

export function ClientProfileTrainingPlan(props: Props): React.JSX.Element {
  return (
    <View style={styles.detailCard}>
      <Pressable onPress={props.onOpenPlanner} style={{ flex: 1 }}>
        <PlanInfo name={props.trainingPlan?.name} t={props.t} />
      </Pressable>
      <RightActions
        hasAssignedPlan={Boolean(props.trainingPlan?.id)}
        onUnassign={props.onUnassign}
        t={props.t}
      />
    </View>
  );
}

function PlanInfo({ name, t }: { name?: string; t: (k: string) => string }) {
  const subtitle = name || t('coach.clientProfile.details.trainingPlan.empty');
  return (
    <View style={styles.detailLeft}>
      <View style={styles.detailIcon}>
        <Text style={styles.detailIconLabel}>{PLAN_ICON}</Text>
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailTitle}>
          {t('coach.clientProfile.details.trainingPlan.title')}
        </Text>
        <Text style={styles.detailSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Arrow(): React.JSX.Element {
  return <Text style={styles.arrow}>{'>'}</Text>;
}

function RightActions(props: {
  hasAssignedPlan: boolean;
  onUnassign: () => void;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.actionsColumn}>
      {props.hasAssignedPlan ? (
        <Pressable onPress={props.onUnassign} style={styles.primaryAction}>
          <Text style={styles.primaryActionLabel}>{props.t('common.unassign')}</Text>
        </Pressable>
      ) : null}
      <Arrow />
    </View>
  );
}

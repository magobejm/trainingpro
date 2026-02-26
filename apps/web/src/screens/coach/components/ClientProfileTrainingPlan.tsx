import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../ClientProfileScreen.styles';

type Props = {
  t: (key: string) => string;
  trainingPlan?: { id: string; name: string };
  onAssign: () => void;
  onUnassign: () => void;
  onOpenDetail: () => void;
};

const PLAN_ICON = '🏋️';

export function ClientProfileTrainingPlan(props: Props): React.JSX.Element {
  const canOpenDetail = Boolean(props.trainingPlan?.id);
  return (
    <Pressable onPress={canOpenDetail ? props.onOpenDetail : undefined} style={styles.detailCard}>
      <PlanInfo name={props.trainingPlan?.name} t={props.t} />
      <PlanActions
        onAssign={props.onAssign}
        onUnassign={props.onUnassign}
        t={props.t}
        hasPlan={!!props.trainingPlan}
      />
    </Pressable>
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

function PlanActions({
  hasPlan,
  onAssign,
  onUnassign,
  t,
}: {
  hasPlan: boolean;
  onAssign: () => void;
  onUnassign: () => void;
  t: (k: string) => string;
}) {
  const label = hasPlan ? t('common.change') : t('common.assign');
  const style = hasPlan ? styles.primaryAction : styles.assignButton;
  const textStyle = hasPlan ? styles.primaryActionLabel : styles.assignLabel;

  return (
    <View style={styles.actionsColumn}>
      <Pressable onPress={onAssign} style={style}>
        <Text style={textStyle}>{label}</Text>
      </Pressable>
      {hasPlan && (
        <Pressable onPress={onUnassign} style={styles.primaryAction}>
          <Text style={styles.primaryActionLabel}>{t('common.unassign')}</Text>
        </Pressable>
      )}
    </View>
  );
}

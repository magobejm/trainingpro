import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { ClientView } from '../../../data/hooks/useClientsQuery';
import { styles } from '../ClientProfileScreen.styles';

type Props = {
  client: ClientView;
  onEdit: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  weightDraftKg: string;
};

export function ClientProfileSummary(props: Props): React.JSX.Element {
  const meta = resolveMeta(props);
  return (
    <View style={styles.summaryRow}>
      <IdentityBlock meta={meta} {...props} />
      <ActionsBlock onEdit={props.onEdit} t={props.t} />
    </View>
  );
}

function resolveMeta(props: Props) {
  return {
    ageLabel: resolveAgeLabel(props.client.birthDate, props.t),
    fcMaxLabel: resolveOptionalMetric(props.client.fcMax, 'bpm', props.t),
    fcRestLabel: resolveOptionalMetric(props.client.fcRest, 'bpm', props.t),
    fitnessLevel: resolveFitnessLevel(props.client.fitnessLevel, props.t),
    fullName: `${props.client.firstName} ${props.client.lastName}`.trim(),
    heightLabel: resolveHeightLabel(props.client.heightCm, props.t),
    hipLabel: resolveOptionalMetric(props.client.hipCm, 'cm', props.t),
    objective: props.client.objective ?? props.t('coach.clientProfile.notReported'),
    waistLabel: resolveOptionalMetric(props.client.waistCm, 'cm', props.t),
    weightLabel: resolveWeightLabel(props.client.weightKg, props.weightDraftKg, props.t),
  };
}

function IdentityBlock(props: Props & { meta: ReturnType<typeof resolveMeta> }): React.JSX.Element {
  return (
    <View style={styles.identityColumn}>
      <Avatar avatarUrl={props.client.avatarUrl} t={props.t} />
      <View style={styles.identityText}>
        <Text style={styles.name}>{props.meta.fullName}</Text>
        <Text style={styles.objective}>
          {`${props.t('coach.clientProfile.stats.objective')}: ${props.meta.objective}`}
        </Text>
        {props.client.notes?.trim() ? (
          <Text style={styles.clientNote}>{props.client.notes.trim()}</Text>
        ) : null}
        <StatsRow
          ageLabel={props.meta.ageLabel}
          fcMaxLabel={props.meta.fcMaxLabel}
          fcRestLabel={props.meta.fcRestLabel}
          fitnessLevel={props.meta.fitnessLevel}
          heightLabel={props.meta.heightLabel}
          hipLabel={props.meta.hipLabel}
          t={props.t}
          waistLabel={props.meta.waistLabel}
          weightLabel={props.meta.weightLabel}
        />
      </View>
    </View>
  );
}

function ActionsBlock(props: {
  onEdit: () => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.actionsColumn}>
      <Pressable onPress={props.onEdit} style={styles.primaryAction}>
        <Text style={styles.primaryActionLabel}>{props.t('coach.clientProfile.actions.edit')}</Text>
      </Pressable>
    </View>
  );
}

function Avatar(props: {
  avatarUrl: null | string;
  t: (key: string) => string;
}): React.JSX.Element {
  if (!props.avatarUrl) {
    return (
      <View style={styles.avatarFallback}>
        <Text style={styles.avatarFallbackLabel}>
          {props.t('coach.clientProfile.avatar.fallback')}
        </Text>
      </View>
    );
  }
  return <Image source={{ uri: props.avatarUrl }} style={styles.avatarImage} />;
}

function StatsRow(props: {
  ageLabel: string;
  fcMaxLabel: string;
  fcRestLabel: string;
  fitnessLevel: string;
  heightLabel: string;
  hipLabel: string;
  t: (key: string) => string;
  waistLabel: string;
  weightLabel: string;
}): React.JSX.Element {
  return (
    <View style={styles.statsRow}>
      <StatPill text={`${props.t('coach.clientProfile.stats.height')}: ${props.heightLabel}`} />
      <StatPill text={`${props.t('coach.clientProfile.stats.weight')}: ${props.weightLabel}`} />
      <StatPill text={`${props.t('coach.clientProfile.stats.age')}: ${props.ageLabel}`} />
      <StatPill text={`${props.t('coach.clientProfile.stats.waist')}: ${props.waistLabel}`} />
      <StatPill text={`${props.t('coach.clientProfile.stats.hip')}: ${props.hipLabel}`} />
      <StatPill text={`${props.t('coach.clientProfile.stats.fcMax')}: ${props.fcMaxLabel}`} />
      <StatPill text={`${props.t('coach.clientProfile.stats.fcRest')}: ${props.fcRestLabel}`} />
      <StatPill
        text={`${props.t('coach.clientProfile.stats.fitnessLevel')}: ${props.fitnessLevel}`}
      />
    </View>
  );
}

function StatPill(props: { text: string }): React.JSX.Element {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillLabel}>{props.text}</Text>
    </View>
  );
}

function resolveAgeLabel(
  birthDate: null | string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const age = toAge(birthDate);
  if (age === null) {
    return t('coach.clientProfile.notReported');
  }
  return t('coach.clientProfile.stats.ageValue', { value: age });
}

function toAge(birthDate: null | string): null | number {
  if (!birthDate) {
    return null;
  }
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDelta = now.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function resolveHeightLabel(
  heightCm: null | number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (heightCm === null) {
    return t('coach.clientProfile.notReported');
  }
  return t('coach.clientProfile.stats.heightValue', { value: heightCm });
}

function resolveWeightLabel(
  persistedWeightKg: null | number | undefined,
  draftWeightKg: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const draft = draftWeightKg.trim();
  if (draft.length > 0) {
    return t('coach.clientProfile.stats.weightValue', { value: draft });
  }
  if (typeof persistedWeightKg === 'number' && Number.isFinite(persistedWeightKg)) {
    return t('coach.clientProfile.stats.weightValue', { value: `${persistedWeightKg}` });
  }
  return t('coach.clientProfile.notReported');
}

function resolveOptionalMetric(
  value: null | number | undefined,
  suffix: string,
  t: (key: string) => string,
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return t('coach.clientProfile.notReported');
  }
  return `${value}${suffix}`;
}

function resolveFitnessLevel(value: null | string | undefined, t: (key: string) => string): string {
  if (!value) {
    return t('coach.clientProfile.fitness.unspecified');
  }
  const map: Record<string, string> = {
    advanced: 'coach.clientProfile.fitness.advanced',
    beginner: 'coach.clientProfile.fitness.beginner',
    elite: 'coach.clientProfile.fitness.elite',
    intermediate: 'coach.clientProfile.fitness.intermediate',
  };
  return t(map[value] ?? 'coach.clientProfile.fitness.unspecified');
}

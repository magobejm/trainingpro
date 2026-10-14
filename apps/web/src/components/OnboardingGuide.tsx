import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, colors, Modal, space } from '@trainerpro/ui';
import { useTranslation } from 'react-i18next';
import { useOnboarding, useSaveOnboarding } from '../data/hooks/useOnboarding';
import { onboardingProgress, onboardingSteps, shouldShowOnboarding, type CoachOnboarding } from '../data/onboarding';
import { useAuthStore } from '../store/auth.store';
import { LoadingState } from './AsyncStatus';
import { useOnboardingNavigation } from './useOnboardingNavigation';

const LIVE_POLITE = 'polite' as const;

export function OnboardingCard(): React.JSX.Element | null {
  const query = useOnboarding();
  if (!query.data || !shouldShowOnboarding(query.data)) return null;
  return <GuideContent data={query.data} />;
}

export function OnboardingUserEntry({ onNavigate }: { onNavigate?: () => void }): React.JSX.Element | null {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const role = useAuthStore((state) => state.activeRole);
  const query = useOnboarding();
  if (role !== 'coach') return null;
  return (
    <>
      <Button
        label={t('coach.onboarding.title')}
        onPress={() => {
          setVisible(true);
          void query.refetch();
        }}
        variant="secondary"
      />
      <Modal
        visible={visible}
        onClose={() => setVisible(false)}
        title={t('coach.onboarding.title')}
        closeLabel={t('common.close')}
        size="md"
      >
        {query.isLoading ? <LoadingState label={t('common.loading')} variant="rows" /> : null}
        {query.isError ? <Button label={t('common.retry')} onPress={() => void query.refetch()} /> : null}
        {query.data ? (
          <GuideContent
            data={query.data}
            onNavigate={() => {
              setVisible(false);
              onNavigate?.();
            }}
          />
        ) : null}
      </Modal>
    </>
  );
}

function GuideContent({ data, onNavigate }: { data: CoachOnboarding; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const openStep = useOnboardingNavigation(onNavigate);
  const save = useSaveOnboarding();
  const progress = onboardingProgress(data.steps);
  return (
    <View
      style={{
        padding: space.lg,
        gap: space.md,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{t('coach.onboarding.title')}</Text>
      <Text accessibilityLiveRegion={LIVE_POLITE} style={{ color: colors.textMuted }}>
        {t('coach.onboarding.progress', progress)}
      </Text>
      {onboardingSteps.map((step, index) => (
        <View key={step} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text
            accessibilityLabel={t(data.steps[step] ? 'coach.onboarding.completed' : 'coach.onboarding.pending')}
            style={{ color: data.steps[step] ? colors.primary : colors.textMuted }}
          >
            {data.steps[step] ? '✓' : `${index + 1}.`}
          </Text>
          <Button
            label={t(`coach.onboarding.steps.${step}`)}
            onPress={() => openStep(step)}
            variant="ghost"
            style={{ flex: 1 }}
          />
        </View>
      ))}
      {progress.completed === progress.total ? (
        <Text style={{ color: colors.text }}>{t('coach.onboarding.done')}</Text>
      ) : null}
      <Button
        label={t(data.hidden ? 'coach.onboarding.show' : 'coach.onboarding.hide')}
        onPress={() => save.mutate(!data.hidden)}
        disabled={save.isPending}
        variant="secondary"
      />
      {save.isError ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>
          {t('coach.onboarding.saveError')}
        </Text>
      ) : null}
    </View>
  );
}

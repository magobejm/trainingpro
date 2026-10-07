import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { UnsavedStatus, UnsavedWorkDialogs } from '../../layout/UnsavedWorkDialogs';
import { useUnsavedWork } from '../../layout/useUnsavedWork';
import type { ClientForm } from './client-profile.form';
import { styles } from './ClientProfileEditScreen.styles';
import { useClientProfileEditState } from './ClientProfileEditScreen.hooks';
import { HeaderCard } from './ClientProfileEditScreen.header';
import { MainLayout } from './ClientProfileEditScreen.body';
import { ProgressGallery } from './ClientProfileEditScreen.gallery';
import { buildLabels, type Labels } from './ClientProfileEditScreen.labels';
import { toForm, toUpdateInput } from './client-profile.form';
import { validateClientProfileForm } from './client-profile.validation';

type Props = {
  clientId: string;
  onArchived?: () => void;
  onBack: () => void;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function ClientProfileEditScreen(props: Props): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const vm = useClientProfileEditState(props.clientId, i18n.language, t);
  if (vm.query.isLoading) return <Text style={styles.helperText}>{t('coach.clientProfile.loading')}</Text>;
  if (vm.query.isError || !vm.query.data) return <Text style={styles.errorText}>{t('coach.clientProfile.error')}</Text>;
  return <EditScreenContent onBack={props.onBack} onArchived={props.onArchived} t={t} vm={vm} />;
}

function EditScreenContent(props: {
  onArchived?: () => void;
  onBack: () => void;
  t: Translate;
  vm: ReturnType<typeof useClientProfileEditState>;
}): React.JSX.Element {
  const labels = buildLabels(props.t, props.vm.state.form);
  const work = useClientProfileDraft(props.vm);
  return (
    <View style={styles.page}>
      <UnsavedWorkDialogs
        onOverwrite={() => void saveForm(props.vm, props.onBack, props.t, work)}
        onReload={() => {
          work.release();
          window.location.reload();
        }}
        t={props.t}
        work={work}
      />
      <UnsavedStatus t={props.t} work={work} />
      <HeaderCard labels={labels} vm={props.vm} />
      <MainLayout labels={labels} onArchived={props.onArchived} t={props.t} vm={props.vm} />
      <BottomActions labels={labels} onBack={props.onBack} t={props.t} vm={props.vm} work={work} />
      <ProgressGallery
        activeIndex={props.vm.data.effectiveGalleryIndex}
        photos={props.vm.data.visiblePhotos}
        setGalleryIndex={props.vm.state.setGalleryIndex}
        t={props.t}
      />
    </View>
  );
}

function BottomActions(props: {
  labels: Labels;
  onBack: () => void;
  t: Translate;
  vm: ReturnType<typeof useClientProfileEditState>;
  work: ReturnType<typeof useUnsavedWork<ClientForm>>;
}): React.JSX.Element {
  const busy = props.work.saving || props.vm.actions.isSaving;
  return (
    <View style={styles.row}>
      <Pressable onPress={props.onBack} style={styles.secondaryButton}>
        <Text style={styles.secondaryLabel}>{props.labels.back}</Text>
      </Pressable>
      <Pressable
        disabled={busy}
        onPress={() => void saveForm(props.vm, props.onBack, props.t, props.work)}
        style={[styles.actionButton, busy ? { opacity: 0.5 } : null]}
      >
        <Text style={styles.actionLabel}>{busy ? props.t('unsaved.saving') : props.labels.save}</Text>
      </Pressable>
    </View>
  );
}

function useClientProfileDraft(vm: ReturnType<typeof useClientProfileEditState>) {
  const clientId = String(vm.query.data?.id ?? 'unknown');
  const [baselineReady, setBaselineReady] = React.useState(false);
  const work = useUnsavedWork({
    enabled: baselineReady,
    onRestore: vm.state.setForm,
    storageKey: `trainerpro.draft.client-profile.${clientId}`,
    value: vm.state.form,
  });
  const adopted = useRef(false);
  useEffect(() => {
    if (!vm.query.data || adopted.current) return;
    const loaded = toForm(vm.query.data as never);
    if (JSON.stringify(vm.state.form) !== JSON.stringify(loaded)) return;
    adopted.current = true;
    work.adopt(loaded, null);
    setBaselineReady(true);
  }, [vm.query.data, vm.state.form, work]);
  return work;
}

async function saveForm(
  vm: ReturnType<typeof useClientProfileEditState>,
  onSaved: () => void,
  t: (key: string) => string,
  work: ReturnType<typeof useUnsavedWork<ClientForm>>,
): Promise<void> {
  const validationErrors = validateClientProfileForm(vm.state.form, t);
  if (Object.keys(validationErrors).length > 0) {
    vm.state.setErrors(validationErrors);
    return;
  }
  work.beginSave();
  try {
    const nextForm = await uploadPendingAvatar(vm);
    await vm.actions.saveClient(toUpdateInput(nextForm));
    vm.state.setErrors({});
    work.release(nextForm);
    onSaved();
  } catch (error) {
    work.endSave();
    throw error;
  }
}

async function uploadPendingAvatar(vm: ReturnType<typeof useClientProfileEditState>) {
  if (!vm.state.pendingAvatarFile) return vm.state.form;
  const result = await vm.actions.uploadAvatar(vm.state.pendingAvatarFile);
  if (vm.state.pendingAvatarPreviewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(vm.state.pendingAvatarPreviewUrl);
  }
  vm.state.setPendingAvatarFile(null);
  vm.state.setPendingAvatarPreviewUrl('');
  const next = { ...vm.state.form, avatarUrl: (result as { avatarUrl: string }).avatarUrl };
  vm.state.setForm(next);
  return next;
}

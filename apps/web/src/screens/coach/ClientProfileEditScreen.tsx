import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { styles } from './ClientProfileEditScreen.styles';
import { useClientProfileEditState } from './ClientProfileEditScreen.hooks';
import { HeaderCard } from './ClientProfileEditScreen.header';
import { MainLayout } from './ClientProfileEditScreen.body';
import { ProgressGallery } from './ClientProfileEditScreen.gallery';
import { buildLabels, type Labels } from './ClientProfileEditScreen.labels';
import { toUpdateInput } from './client-profile.form';
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
  if (vm.query.isLoading)
    return <Text style={styles.helperText}>{t('coach.clientProfile.loading')}</Text>;
  if (vm.query.isError || !vm.query.data)
    return <Text style={styles.errorText}>{t('coach.clientProfile.error')}</Text>;
  return <EditScreenContent onBack={props.onBack} onArchived={props.onArchived} t={t} vm={vm} />;
}

function EditScreenContent(props: {
  onArchived?: () => void;
  onBack: () => void;
  t: Translate;
  vm: ReturnType<typeof useClientProfileEditState>;
}): React.JSX.Element {
  const labels = buildLabels(props.t, props.vm.state.form);
  return (
    <View style={styles.page}>
      <HeaderCard labels={labels} vm={props.vm} />
      <MainLayout labels={labels} onArchived={props.onArchived} t={props.t} vm={props.vm} />
      <BottomActions labels={labels} onBack={props.onBack} t={props.t} vm={props.vm} />
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
}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Pressable onPress={props.onBack} style={styles.secondaryButton}>
        <Text style={styles.secondaryLabel}>{props.labels.back}</Text>
      </Pressable>
      <Pressable
        onPress={() => void saveForm(props.vm, props.onBack, props.t)}
        style={styles.actionButton}
      >
        <Text style={styles.actionLabel}>{props.labels.save}</Text>
      </Pressable>
    </View>
  );
}

async function saveForm(
  vm: ReturnType<typeof useClientProfileEditState>,
  onSaved: () => void,
  t: (key: string) => string,
): Promise<void> {
  const validationErrors = validateClientProfileForm(vm.state.form, t);
  if (Object.keys(validationErrors).length > 0) {
    vm.state.setErrors(validationErrors);
    return;
  }
  const nextForm = await uploadPendingAvatar(vm);
  await vm.actions.saveClient(toUpdateInput(nextForm));
  vm.state.setErrors({});
  onSaved();
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

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import { Button, IconButton, Modal, TextField, useToast } from '@trainerpro/ui';
import { useUserSettings } from '../data/hooks/useUserSettings';
import { styles } from './SidebarUserPanel.styles';

const GEAR_GLYPH = '\u2699\uFE0F';
const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SMALL = 'sm' as const;
const TRANSPARENT = { backgroundColor: 'transparent' } as const;

type Props = {
  email: string;
  fallbackName: string;
  t: (key: string) => string;
};

export function SidebarUserPanel(props: Props): React.JSX.Element {
  const vm = useSidebarUserPanelModel(props.email, props.fallbackName);
  return <SidebarUserPanelView {...vm} t={props.t} />;
}

function useSidebarUserPanelModel(email: string, fallbackName: string) {
  const profile = useUserSettings(email);
  const toast = useToast();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(profile.settings);
  const onOpen = () => {
    setForm(profile.settings);
    setIsOpen(true);
  };
  const onSave = async () => {
    await profile.saveSettings(form);
    setIsOpen(false);
    toast.success(t('app.user.modal.saved'));
  };
  return {
    avatarUrl: profile.avatarUrl,
    displayName: profile.displayName.trim() || fallbackName,
    form,
    isOpen,
    onClose: () => setIsOpen(false),
    onOpen,
    onSave,
    setForm,
  };
}

type ViewModel = ReturnType<typeof useSidebarUserPanelModel> & { t: (key: string) => string };

function SidebarUserPanelView(props: ViewModel): React.JSX.Element {
  return (
    <>
      <View style={styles.card}>
        <View style={styles.userTop}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: props.avatarUrl }} style={styles.avatar} />
          </View>
          <View style={styles.info}>
            <Text numberOfLines={1} style={styles.name}>
              {props.displayName}
            </Text>
            <Text numberOfLines={1} style={styles.email}>
              {props.form.email}
            </Text>
          </View>
          <IconButton
            accessibilityLabel={props.t('app.user.modal.title')}
            icon={() => <Text style={styles.gearIcon}>{GEAR_GLYPH}</Text>}
            onPress={props.onOpen}
            style={TRANSPARENT}
          />
        </View>
      </View>
      <EditProfileModal {...props} />
    </>
  );
}

function EditProfileModal(props: ViewModel): React.JSX.Element {
  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={
        <>
          <Button label={props.t('app.user.modal.cancel')} onPress={props.onClose} variant={VARIANT_SECONDARY} />
          <Button label={props.t('app.user.modal.save')} onPress={() => void props.onSave()} />
        </>
      }
      onClose={props.onClose}
      size="sm"
      title={props.t('app.user.modal.title')}
      visible={props.isOpen}
    >
      <View style={styles.modalBody}>
        <AvatarEditor {...props} />
        <ProfileFields {...props} />
      </View>
    </Modal>
  );
}

function AvatarEditor(props: ViewModel): React.JSX.Element {
  return (
    <View style={styles.avatarEditor}>
      <Image source={{ uri: props.form.avatarUrl ?? props.avatarUrl }} style={styles.avatarLarge} />
      <Button
        label={props.t('app.user.modal.avatar')}
        onPress={() => void pickAvatar(props)}
        size={SIZE_SMALL}
        variant={VARIANT_SECONDARY}
      />
    </View>
  );
}

async function pickAvatar(props: ViewModel): Promise<void> {
  const file = await pickImageFile();
  if (!file) {
    return;
  }
  const dataUrl = await readFileAsDataUrl(file);
  props.setForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
}

function ProfileFields(props: ViewModel): React.JSX.Element {
  return (
    <View style={styles.fields}>
      <Field
        label={props.t('app.user.modal.email')}
        editable={false}
        onChange={(value) => props.setForm((prev) => ({ ...prev, email: value }))}
        value={props.form.email}
      />
      <Field
        label={props.t('app.user.modal.firstName')}
        onChange={(value) => props.setForm((prev) => ({ ...prev, firstName: value }))}
        value={props.form.firstName}
      />
      <Field
        label={props.t('app.user.modal.lastName')}
        onChange={(value) => props.setForm((prev) => ({ ...prev, lastName: value }))}
        value={props.form.lastName}
      />
    </View>
  );
}

function Field(props: { editable?: boolean; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <TextField disabled={props.editable === false} label={props.label} onChangeText={props.onChange} value={props.value} />
  );
}

function pickImageFile(): Promise<File | null> {
  if (typeof document === 'undefined') {
    return Promise.resolve(null);
  }
  const input = document.createElement('input');
  input.accept = 'image/png,image/jpeg,image/webp';
  input.type = 'file';
  return new Promise((resolve) => {
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('avatar-read-error'));
    reader.readAsDataURL(file);
  });
}

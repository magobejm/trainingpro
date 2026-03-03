import React, { useState } from 'react';
import { Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useUserSettings } from '../data/hooks/useUserSettings';
import { styles } from './SidebarUserPanel.styles';

const MODAL_ANIMATION = 'fade' as const;

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
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(profile.settings);
  const onOpen = () => {
    setForm(profile.settings);
    setIsOpen(true);
  };
  const onSave = async () => {
    await profile.saveSettings(form);
    setIsOpen(false);
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
          <Pressable onPress={props.onOpen} style={styles.gearButton}>
            {/* eslint-disable-next-line no-restricted-syntax */}
            <Text style={styles.gearIcon}>⚙️</Text>
          </Pressable>
        </View>
      </View>
      <EditProfileModal {...props} />
    </>
  );
}

function EditProfileModal(props: ViewModel): React.JSX.Element {
  return (
    <Modal
      animationType={MODAL_ANIMATION}
      onRequestClose={props.onClose}
      transparent
      visible={props.isOpen}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{props.t('app.user.modal.title')}</Text>
          <AvatarEditor {...props} />
          <ProfileFields {...props} />
          <View style={styles.actions}>
            <Pressable onPress={props.onClose} style={styles.cancelButton}>
              <Text style={styles.cancelLabel}>{props.t('app.user.modal.cancel')}</Text>
            </Pressable>
            <Pressable onPress={() => void props.onSave()} style={styles.saveButton}>
              <Text style={styles.saveLabel}>{props.t('app.user.modal.save')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AvatarEditor(props: ViewModel): React.JSX.Element {
  return (
    <View style={styles.avatarEditor}>
      <Image source={{ uri: props.form.avatarUrl ?? props.avatarUrl }} style={styles.avatarLarge} />
      <Pressable onPress={() => void pickAvatar(props)} style={styles.changeAvatarButton}>
        <Text style={styles.changeAvatarLabel}>{props.t('app.user.modal.avatar')}</Text>
      </Pressable>
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

function Field(props: {
  editable?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const isEditable = props.editable ?? true;
  return (
    <View>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        editable={isEditable}
        onChangeText={props.onChange}
        style={[styles.input, !isEditable ? styles.inputReadonly : null]}
        value={props.value}
      />
    </View>
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

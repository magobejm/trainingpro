import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useUserSettings } from '../data/hooks/useUserSettings';

const GEAR_ICON = '⚙️';
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
        <Image source={{ uri: props.avatarUrl }} style={styles.avatar} />
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.name}>{props.displayName}</Text>
          <Text numberOfLines={1} style={styles.email}>{props.form.email}</Text>
        </View>
        <Pressable onPress={props.onOpen} style={styles.gearButton}>
          <Text style={styles.gearIcon}>{GEAR_ICON}</Text>
        </Pressable>
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

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  avatar: {
    borderRadius: 999,
    height: 40,
    width: 40,
  },
  avatarEditor: {
    alignItems: 'center',
    gap: 8,
  },
  avatarLarge: {
    borderRadius: 999,
    height: 72,
    width: 72,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#edf3fb',
    borderColor: '#d6e2f2',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  cancelLabel: {
    color: '#38557f',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#111a27',
    borderColor: '#1e2a3a',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    padding: 10,
  },
  changeAvatarButton: {
    alignItems: 'center',
    backgroundColor: '#edf3fb',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 12,
  },
  changeAvatarLabel: {
    color: '#1c3f74',
    fontSize: 12,
    fontWeight: '700',
  },
  email: {
    color: '#9aa5b1',
    fontSize: 11,
  },
  fieldLabel: {
    color: '#3b4f70',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  fields: {
    gap: 9,
  },
  gearButton: {
    alignItems: 'center',
    backgroundColor: '#1f2a3a',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  gearIcon: {
    color: '#dce8ff',
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  input: {
    backgroundColor: '#f4f8ff',
    borderColor: '#d7e2f3',
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputReadonly: {
    backgroundColor: '#edf2f8',
    color: '#5f6f84',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    gap: 10,
    maxWidth: 420,
    padding: 16,
    width: '100%',
  },
  modalTitle: {
    color: '#111418',
    fontSize: 20,
    fontWeight: '800',
  },
  name: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 17, 24, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#1c74e9',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  saveLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});

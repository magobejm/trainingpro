import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';

export function CoachPage({ title, children, onBack }: { title: string; children: React.ReactNode; onBack?: () => void }) {
  return (
    <KeyboardAvoidingView style={ui.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps={'handled'} contentContainerStyle={ui.content}>
        <View style={ui.row}>
          {onBack ? <CoachButton label={'‹'} onPress={onBack} /> : null}
          <Text accessibilityRole={'header'} style={ui.title}>
            {title}
          </Text>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function CoachButton({
  label,
  onPress,
  disabled,
  loading,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={'button'}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={[ui.button, danger && ui.danger, (disabled || loading) && ui.disabled]}
    >
      {loading ? <ActivityIndicator color={LIGHT.textOnNavy} /> : <Text style={ui.buttonText}>{label}</Text>}
    </Pressable>
  );
}
export function CoachField({
  label,
  value,
  onChange,
  numeric,
  multiline,
  secure,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
  multiline?: boolean;
  secure?: boolean;
}) {
  return (
    <View style={ui.field}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        multiline={multiline}
        secureTextEntry={secure}
        style={[ui.input, multiline && ui.multiline]}
      />
    </View>
  );
}
export function CoachSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  if (options.length > 6)
    return (
      <View style={ui.field}>
        <Text style={ui.label}>{label}</Text>
        <CoachButton
          label={(options.find((option) => option.value === value)?.label ?? t('coachWorkspace.choose')) + ' ▾'}
          onPress={() => setOpen(true)}
        />
        <CoachChoiceDialog
          visible={open}
          label={label}
          options={options}
          onClose={() => setOpen(false)}
          onSelect={(next) => {
            onChange(next);
            setOpen(false);
          }}
        />
      </View>
    );
  return (
    <View style={ui.field}>
      <Text style={ui.label}>{label}</Text>
      <View style={ui.row}>
        {options.map((option) => (
          <Pressable
            accessibilityRole={'radio'}
            accessibilityState={{ checked: option.value === value }}
            onPress={() => onChange(option.value)}
            key={option.value}
            style={[ui.chip, option.value === value && ui.chipSelected]}
          >
            <Text style={[ui.chipText, option.value === value && ui.chipTextSelected]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
function CoachChoiceDialog({
  visible,
  label,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean;
  label: string;
  options: { value: string; label: string }[];
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  return (
    <Modal visible={visible} transparent animationType={'fade'} onRequestClose={onClose}>
      <View style={ui.modalBackdrop}>
        <View style={ui.modalSheet}>
          <Text style={ui.label}>{label}</Text>
          <CoachField label={t('coachWorkspace.search')} value={search} onChange={setSearch} />
          <FlatList
            data={options.filter((option) => option.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()))}
            keyExtractor={(option) => option.value}
            keyboardShouldPersistTaps={'handled'}
            renderItem={({ item }) => (
              <CoachButton
                label={item.label}
                onPress={() => {
                  onSelect(item.value);
                  setSearch('');
                }}
              />
            )}
          />
          <CoachButton label={t('coachWorkspace.cancel')} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
type QueryState = { isLoading: boolean; isError: boolean; error?: unknown; data?: unknown; refetch: () => unknown };
export function CoachStatus({ query, empty }: { query: QueryState; empty?: boolean }) {
  const { t } = useTranslation();
  if (query.isLoading) return <ActivityIndicator accessibilityLabel={t('coachWorkspace.loading')} color={LIGHT.accent} />;
  if (query.isError)
    return (
      <View style={ui.card}>
        <Text style={ui.error}>{t('coachWorkspace.loadError')}</Text>
        <CoachButton label={t('coachWorkspace.retry')} onPress={() => void query.refetch()} />
      </View>
    );
  return empty ? <Text style={ui.muted}>{t('coachWorkspace.empty')}</Text> : null;
}
export function CoachConflict({ conflict, onDiscard }: { conflict: boolean; onDiscard: () => void }) {
  const { t } = useTranslation();
  return conflict ? (
    <View style={ui.card}>
      <Text style={ui.error}>{t('coachWorkspace.conflict')}</Text>
      <CoachButton label={t('coachWorkspace.reload')} onPress={onDiscard} />
    </View>
  ) : null;
}
export function confirmCoachDelete(label: string, action: () => void, t: (key: string) => string) {
  if (Platform.OS === 'web') {
    const browser = globalThis as { confirm?: (message: string) => boolean };
    if (browser.confirm?.(label)) action();
  } else
    Alert.alert(t('coachWorkspace.confirmDelete'), label, [
      { text: t('coachWorkspace.cancel'), style: 'cancel' },
      { text: t('coachWorkspace.delete'), style: 'destructive', onPress: action },
    ]);
}
export const ui = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: LIGHT.overlay, padding: 20, justifyContent: 'center' },
  modalSheet: { backgroundColor: LIGHT.bgSoft, borderRadius: LIGHT.radiusLg, padding: 16, maxHeight: '80%', gap: 12 },
  page: { flex: 1, minHeight: 0, backgroundColor: LIGHT.bgSoft },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  title: { color: LIGHT.textStrong, fontSize: 24, fontWeight: '800', flexShrink: 1 },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusLg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: LIGHT.border,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  field: { gap: 6 },
  label: { color: LIGHT.text, fontWeight: '600', fontSize: 14 },
  input: {
    minHeight: 44,
    padding: 12,
    color: LIGHT.textStrong,
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    borderColor: LIGHT.borderStrong,
    fontSize: 16,
  },
  multiline: { minHeight: 92, textAlignVertical: 'top' },
  button: {
    minHeight: 44,
    borderRadius: LIGHT.radiusSm,
    backgroundColor: LIGHT.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: LIGHT.textOnNavy, fontWeight: '700', fontSize: 14 },
  danger: { backgroundColor: LIGHT.error },
  disabled: { opacity: 0.45 },
  chip: {
    minHeight: 44,
    borderRadius: LIGHT.radiusFull,
    backgroundColor: LIGHT.accentSoft,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: LIGHT.accent },
  chipText: { color: LIGHT.text },
  chipTextSelected: { color: LIGHT.textOnNavy },
  muted: { color: LIGHT.textMuted, fontSize: 14 },
  error: { color: LIGHT.error, fontSize: 14 },
  text: { color: LIGHT.text, fontSize: 16 },
});

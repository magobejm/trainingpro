import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCreateIncidentMutation } from '../../data/hooks/useIncidents';
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';

type IncidentCategory = 'molestia' | 'dolor' | 'lesion' | 'otro';

type ExerciseCommentModalProps = {
  sessionId: string;
  sessionItemId?: null | string;
  visible: boolean;
  onClose: () => void;
};

const CATEGORIES: Array<{ id: IncidentCategory; severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM' }> = [
  { id: 'molestia', severity: 'LOW' },
  { id: 'dolor', severity: 'MEDIUM' },
  { id: 'lesion', severity: 'HIGH' },
  { id: 'otro', severity: 'LOW' },
];

export function ExerciseCommentModal({
  sessionId,
  sessionItemId,
  visible,
  onClose,
}: ExerciseCommentModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const createMutation = useCreateIncidentMutation();
  const [text, setText] = useState('');
  const [reportIncident, setReportIncident] = useState(false);
  const [category, setCategory] = useState<IncidentCategory>('molestia');

  const handleSubmit = () => {
    if (!text.trim()) {
      onClose();
      return;
    }
    if (reportIncident) {
      const selected = CATEGORIES.find((entry) => entry.id === category) ?? CATEGORIES[0]!;
      createMutation.mutate(
        {
          description: text.trim(),
          sessionId,
          sessionItemId: sessionItemId ?? null,
          severity: selected.severity,
          tag: category,
        },
        {
          onSuccess: () => {
            setText('');
            setReportIncident(false);
            onClose();
          },
        },
      );
      return;
    }
    setText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType={'slide'} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={SESSION.backBtn} onPress={onClose}>
            <Text style={SESSION.backArrow}>{'←'}</Text>
          </Pressable>
          <Text style={styles.title}>{t('mobile.client.comment.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={5}
            value={text}
            onChangeText={setText}
            placeholder={t('client.incident.descriptionPlaceholder')}
            placeholderTextColor={LIGHT.textMuted}
          />
          <Pressable style={styles.toggleRow} onPress={() => setReportIncident((value) => !value)}>
            <View style={[styles.checkbox, reportIncident && styles.checkboxActive]} />
            <Text style={styles.toggleLabel}>{t('mobile.client.comment.reportIncident')}</Text>
          </Pressable>
          {reportIncident ? (
            <View style={styles.chips}>
              {CATEGORIES.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.chip, category === item.id && styles.chipActive]}
                  onPress={() => setCategory(item.id)}
                >
                  <Text style={[styles.chipText, category === item.id && styles.chipTextActive]}>
                    {t(`mobile.client.comment.category.${item.id}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <ActivityIndicator color={LIGHT.textOnNavy} />
            ) : (
              <Text style={styles.submitText}>{t('client.finish.submit')}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: SESSION.modalOverlay,
  header: {
    ...SESSION.header,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  title: {
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  body: {
    gap: 16,
    padding: 16,
  },
  textarea: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 15,
    minHeight: 120,
    padding: 14,
    textAlignVertical: 'top',
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  checkbox: {
    borderColor: LIGHT.borderStrong,
    borderRadius: 4,
    borderWidth: 2,
    height: 20,
    width: 20,
  },
  checkboxActive: {
    backgroundColor: LIGHT.accent,
    borderColor: LIGHT.accent,
  },
  toggleLabel: {
    color: LIGHT.text,
    fontSize: 14,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.accent,
  },
  chipText: {
    color: LIGHT.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: LIGHT.accentDark,
  },
  footer: {
    borderTopColor: LIGHT.border,
    borderTopWidth: 1,
    padding: 16,
  },
  submitBtn: SESSION.primaryBtn,
  submitText: SESSION.primaryBtnText,
});

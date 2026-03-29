import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

const MODAL_ANIMATION = 'fade' as const;
const ICON_CLOSE = '✕';
import type { WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';
import { WarmupExerciseList } from './WarmupExerciseList';

type Props = {
  template: null | WarmupTemplateView;
  onClose: () => void;
  t: (k: string) => string;
  visible: boolean;
};

export function WarmupTemplateDetailModal({ template, onClose, t, visible }: Props): React.JSX.Element {
  return (
    <Modal animationType={MODAL_ANIMATION} onRequestClose={onClose} transparent visible={visible}>
      <View style={st.overlay}>
        <View style={st.sheet}>
          <View style={st.header}>
            <Text style={st.title}>{template?.name ?? t('coach.routine.warmup.detail.title')}</Text>
            <Pressable onPress={onClose} style={st.closeBtn}>
              <Text style={st.closeBtnText}>{ICON_CLOSE}</Text>
            </Pressable>
          </View>
          {template ? (
            <ScrollView style={st.body}>
              <WarmupExerciseList items={template.items} groups={template.groups} />
            </ScrollView>
          ) : (
            <View style={st.loading}>
              <Text style={st.loadingText}>{t('common.loading')}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const st = {
  overlay: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center' as const,
    padding: 24,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 14,
    maxHeight: '85vh' as unknown as number,
    maxWidth: 620,
    width: '100%' as const,
    overflow: 'hidden' as const,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700' as const,
    flex: 1,
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginLeft: 8,
  },
  closeBtnText: { fontSize: 12, color: '#475569' },
  body: { maxHeight: '75vh' as unknown as number },
  loading: { padding: 24, alignItems: 'center' as const },
  loadingText: { fontSize: 14, color: '#94a3b8' },
};

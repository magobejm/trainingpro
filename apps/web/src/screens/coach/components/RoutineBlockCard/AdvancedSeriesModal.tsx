import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ADVANCED_TECHNIQUE_IDS, normalizeAdvancedTechniqueId, type AdvancedTechniqueId } from './advanced-technique.i18n';

const MODAL_ANIM = 'fade' as const;
const ICON_CLOSE = '✕';

interface AdvancedSeriesModalProps {
  visible: boolean;
  seriesIndex: number;
  currentValue?: string;
  onClose: () => void;
  onApply: (technique: string) => void;
  onRemove: () => void;
}

export function AdvancedSeriesModal({
  visible,
  seriesIndex,
  currentValue,
  onClose,
  onApply,
  onRemove,
}: AdvancedSeriesModalProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<AdvancedTechniqueId>(() => normalizeAdvancedTechniqueId(currentValue));

  useEffect(() => {
    if (visible) setSelected(normalizeAdvancedTechniqueId(currentValue));
  }, [visible, currentValue]);

  const nameKey = `coach.routine.advancedTechnique.${selected}`;
  const descKey = `${nameKey}.desc`;

  return (
    <Modal animationType={MODAL_ANIM} onRequestClose={onClose} transparent visible={visible}>
      <View style={st.overlay}>
        <View style={st.dialog}>
          <View style={st.header}>
            <Text style={st.title}>{t('coach.routine.advancedSeries.title')}</Text>
            <TouchableOpacity onPress={onClose} style={st.closeBtn}>
              <Text style={st.closeIcon}>{ICON_CLOSE}</Text>
            </TouchableOpacity>
          </View>

          <View style={st.body}>
            <ScrollView style={st.sidebar}>
              {ADVANCED_TECHNIQUE_IDS.map((id) => (
                <TouchableOpacity
                  key={id}
                  onPress={() => setSelected(id)}
                  style={[st.sidebarItem, selected === id && st.sidebarItemActive]}
                >
                  <Text style={[st.sidebarItemText, selected === id && st.sidebarItemTextActive]}>
                    {t(`coach.routine.advancedTechnique.${id}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={st.content}>
              <Text style={st.contentTitle}>{t(nameKey)}</Text>
              <ScrollView style={st.descScroll}>
                <Text style={st.descText}>{t(descKey)}</Text>
              </ScrollView>
            </View>
          </View>

          <View style={st.footer}>
            {currentValue ? (
              <TouchableOpacity onPress={onRemove} style={st.removeBtn}>
                <Text style={st.removeBtnText}>{t('coach.routine.advancedSeries.removeTechnique')}</Text>
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => {
                onApply(selected);
                onClose();
              }}
              style={st.applyBtn}
            >
              <Text style={st.applyBtnText}>{t('coach.routine.advancedSeries.applyToSet', { n: seriesIndex + 1 })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const st = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%' as const,
    maxWidth: 700,
    maxHeight: '85%' as const,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    display: 'flex' as const,
    flexDirection: 'column' as const,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 16, fontWeight: '700' as const, color: '#1e293b' },
  closeBtn: { padding: 4 },
  closeIcon: { fontSize: 18, color: '#94a3b8' },
  body: {
    flexDirection: 'row' as const,
    flex: 1,
    minHeight: 280,
  },
  sidebar: {
    width: 180,
    flexShrink: 0,
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
    paddingVertical: 8,
  },
  sidebarItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  sidebarItemActive: { backgroundColor: '#dbeafe' },
  sidebarItemText: { fontSize: 13, fontWeight: '500' as const, color: '#64748b' },
  sidebarItemTextActive: { color: '#1d4ed8', fontWeight: '700' as const },
  content: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  contentTitle: { fontSize: 17, fontWeight: '700' as const, color: '#1e293b' },
  descScroll: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  descText: { fontSize: 13, color: '#334155', lineHeight: 20 },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fafafa',
    gap: 12,
  },
  removeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fee2e2',
  },
  removeBtnText: { fontSize: 13, color: '#dc2626', fontWeight: '500' as const },
  applyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  applyBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' as const },
};

import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ADVANCED_TECHNIQUE_IDS, normalizeAdvancedTechniqueId, type AdvancedTechniqueId } from './advanced-technique.i18n';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const MODAL_ANIM = 'fade' as const;
const ICON_CLOSE = '✕';

interface AdvancedSeriesModalProps {
  visible: boolean;
  seriesIndex: number;
  currentValue?: string;
  viewOnly?: boolean;
  onClose: () => void;
  onApply: (technique: string) => void;
  onRemove: () => void;
}

export function AdvancedSeriesModal({
  visible,
  seriesIndex,
  currentValue,
  viewOnly = false,
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
            {!viewOnly ? (
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
            ) : null}

            <View style={[st.content, viewOnly && { paddingLeft: space.xl }]}>
              <Text style={st.contentTitle}>{t(nameKey)}</Text>
              <ScrollView style={st.descScroll}>
                <Text style={st.descText}>{t(descKey)}</Text>
              </ScrollView>
            </View>
          </View>

          <View style={st.footer}>
            {!viewOnly && currentValue ? (
              <TouchableOpacity onPress={onRemove} style={st.removeBtn}>
                <Text style={st.removeBtnText}>{t('coach.routine.advancedSeries.removeTechnique')}</Text>
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }} />
            {viewOnly ? (
              <TouchableOpacity onPress={onClose} style={st.applyBtn}>
                <Text style={st.applyBtnText}>{t('common.close')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  onApply(selected);
                  onClose();
                }}
                style={st.applyBtn}
              >
                <Text style={st.applyBtnText}>{t('coach.routine.advancedSeries.applyToSet', { n: seriesIndex + 1 })}</Text>
              </TouchableOpacity>
            )}
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
    padding: space.xl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: '100%' as const,
    maxWidth: 700,
    maxHeight: '85%' as const,
    overflow: 'hidden' as const,
    shadowColor: colors.text,
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
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  title: { fontSize: fontSize.md, fontWeight: '700' as const, color: colors.text },
  closeBtn: { padding: space.xs },
  closeIcon: { fontSize: fontSize.lg, color: colors.textMuted },
  body: {
    flexDirection: 'row' as const,
    flex: 1,
    minHeight: 280,
  },
  sidebar: {
    width: 180,
    flexShrink: 0,
    backgroundColor: colors.surfaceMuted,
    borderRightWidth: 1,
    borderRightColor: colors.background,
    paddingVertical: space.sm,
  },
  sidebarItem: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.sm,
    marginHorizontal: space.xs,
    marginVertical: 2,
  },
  sidebarItemActive: { backgroundColor: colors.primaryBorder },
  sidebarItemText: { fontSize: fontSize.sm, fontWeight: '500' as const, color: colors.textMuted },
  sidebarItemTextActive: { color: colors.primaryHover, fontWeight: '700' as const },
  content: {
    flex: 1,
    padding: space.xl,
    gap: space.md,
  },
  contentTitle: { fontSize: fontSize.lg, fontWeight: '700' as const, color: colors.text },
  descScroll: {
    flex: 1,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  descText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.background,
    backgroundColor: colors.surfaceMuted,
    gap: space.md,
  },
  removeBtn: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    backgroundColor: colors.dangerSoft,
  },
  removeBtnText: { fontSize: fontSize.sm, color: colors.danger, fontWeight: '500' as const },
  applyBtn: {
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  applyBtnText: { fontSize: fontSize.sm, color: colors.surface, fontWeight: '600' as const },
};

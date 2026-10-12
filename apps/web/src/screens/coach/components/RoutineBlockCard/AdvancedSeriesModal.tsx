import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ADVANCED_TECHNIQUE_IDS, normalizeAdvancedTechniqueId, type AdvancedTechniqueId } from './advanced-technique.i18n';
import { Button, Modal, colors, fontSize, radius, space } from '@trainerpro/ui';

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
    <Modal
      closeLabel={t('common.close')}
      footer={
        <>
          {!viewOnly && currentValue ? (
            <Button label={t('coach.routine.advancedSeries.removeTechnique')} onPress={onRemove} variant="danger" />
          ) : null}
          <View style={st.spacer} />
          {viewOnly ? (
            <Button label={t('common.close')} onPress={onClose} />
          ) : (
            <Button
              label={t('coach.routine.advancedSeries.applyToSet', { n: seriesIndex + 1 })}
              onPress={() => {
                onApply(selected);
                onClose();
              }}
            />
          )}
        </>
      }
      onClose={onClose}
      scroll={false}
      size="lg"
      title={t('coach.routine.advancedSeries.title')}
      visible={visible}
    >
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
    </Modal>
  );
}

const st = {
  spacer: { flex: 1 },
  body: {
    flexDirection: 'row' as const,
    minHeight: 280,
  },
  sidebar: {
    width: 180,
    maxHeight: 360,
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
    maxHeight: 320,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  descText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
};

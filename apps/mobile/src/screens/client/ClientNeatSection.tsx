import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ClientRoutineNeat } from '../../data/hooks/useClientRoutineQuery';
import { LIGHT } from '../../theme/light';
import { shouldShowClientNeatSection } from './client-neat.utils';

const INFO_ICON = 'ⓘ';
const CLOSE_ICON = '✕';

type ClientNeatSectionProps = {
  neats: ClientRoutineNeat[] | undefined;
};

export function ClientNeatSection({ neats }: ClientNeatSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [conceptOpen, setConceptOpen] = useState(false);
  const [selected, setSelected] = useState<ClientRoutineNeat | null>(null);

  if (!shouldShowClientNeatSection(neats)) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Pressable onPress={() => setConceptOpen(true)} style={styles.titleRow}>
          <Text style={styles.title}>{t('mobile.client.neat.title')}</Text>
          <Text style={styles.infoIcon}>{INFO_ICON}</Text>
        </Pressable>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('mobile.client.neat.badge')}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {neats?.map((neat) => (
          <Pressable key={neat.id} onPress={() => setSelected(neat)} style={styles.card}>
            <Text style={styles.cardTitle}>{neat.title}</Text>
          </Pressable>
        ))}
      </View>
      <NeatConceptModal onClose={() => setConceptOpen(false)} visible={conceptOpen} />
      <NeatActivityModal neat={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

function NeatConceptModal(props: { onClose: () => void; visible: boolean }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Modal animationType={'fade'} onRequestClose={props.onClose} transparent visible={props.visible}>
      <Pressable onPress={props.onClose} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.modalCard}>
          <Pressable onPress={props.onClose} style={styles.closeEmerald}>
            <Text style={styles.closeEmeraldText}>{CLOSE_ICON}</Text>
          </Pressable>
          <View style={styles.conceptHeader}>
            <View style={styles.conceptInfoBadge}>
              <Text style={styles.modalInfoIcon}>{INFO_ICON}</Text>
            </View>
            <View style={styles.modalTitleTexts}>
              <Text style={styles.modalTitle}>{t('mobile.client.neat.title')}</Text>
              <Text style={styles.modalSubtitle}>{t('mobile.client.neat.conceptKey')}</Text>
            </View>
          </View>
          <View style={styles.conceptDescBox}>
            <Text style={styles.fieldLabel}>{t('mobile.client.neat.descriptionLabel')}</Text>
            <Text style={styles.conceptSummary}>{t('mobile.client.neat.conceptSummary')}</Text>
          </View>
          <Text style={styles.conceptBody}>{t('mobile.client.neat.conceptBody')}</Text>
          <Pressable onPress={props.onClose} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{t('mobile.client.neat.understood')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function NeatActivityModal(props: { neat: ClientRoutineNeat | null; onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const description = props.neat?.description?.trim() || t('mobile.client.neat.activityEmpty');
  return (
    <Modal animationType={'fade'} onRequestClose={props.onClose} transparent visible={props.neat != null}>
      <Pressable onPress={props.onClose} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.modalCard}>
          <Pressable onPress={props.onClose} style={styles.closeGray}>
            <Text style={styles.closeGrayText}>{CLOSE_ICON}</Text>
          </Pressable>
          <View style={styles.detailBadge}>
            <Text style={styles.detailBadgeText}>{t('mobile.client.neat.detailBadge')}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('mobile.client.neat.titleLabel')}</Text>
            <View style={styles.titleBox}>
              <Text style={styles.titleBoxText}>{props.neat?.title ?? t('mobile.client.neat.title')}</Text>
            </View>
          </View>
          <View style={styles.fieldGrow}>
            <Text style={styles.fieldLabel}>{t('mobile.client.neat.descriptionLabel')}</Text>
            <ScrollView style={styles.descScroll}>
              <View style={styles.descBox}>
                <Text style={styles.descBoxText}>{description}</Text>
              </View>
            </ScrollView>
          </View>
          <Pressable onPress={props.onClose} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{t('mobile.client.neat.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  title: {
    color: LIGHT.emerald,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoIcon: {
    color: LIGHT.emerald,
    fontSize: 15,
  },
  badge: {
    backgroundColor: LIGHT.emeraldSoft,
    borderColor: '#a7f3d0',
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: LIGHT.success,
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.emeraldSoft,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 2,
    flexBasis: '30%',
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'center',
    maxWidth: '32%',
    minHeight: 95,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  cardTitle: {
    color: LIGHT.textStrong,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.emeraldSoft,
    borderRadius: 32,
    borderWidth: 1,
    gap: 16,
    padding: 24,
    width: '100%',
  },
  closeEmerald: {
    alignItems: 'center',
    backgroundColor: LIGHT.emeraldSoft,
    borderRadius: LIGHT.radiusFull,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
    zIndex: 1,
  },
  closeEmeraldText: {
    color: LIGHT.emerald,
    fontSize: 14,
  },
  closeGray: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgSoft,
    borderRadius: LIGHT.radiusFull,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
    zIndex: 1,
  },
  closeGrayText: {
    color: LIGHT.textMuted,
    fontSize: 14,
  },
  conceptHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingRight: 36,
  },
  conceptInfoBadge: {
    alignItems: 'center',
    backgroundColor: LIGHT.emeraldSoft,
    borderRadius: LIGHT.radiusMd,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  modalInfoIcon: {
    color: LIGHT.emerald,
    fontSize: 18,
    fontWeight: '700',
  },
  modalTitleTexts: {
    flex: 1,
    gap: 2,
  },
  modalTitle: {
    color: LIGHT.emerald,
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: LIGHT.success,
    fontSize: 11,
    fontWeight: '600',
  },
  conceptDescBox: {
    backgroundColor: LIGHT.emeraldSoft,
    borderColor: '#a7f3d0',
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  fieldLabel: {
    color: LIGHT.success,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  conceptSummary: {
    color: LIGHT.textStrong,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  conceptBody: {
    color: LIGHT.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.emerald,
    borderRadius: LIGHT.radiusLg,
    paddingVertical: 14,
  },
  primaryBtnText: {
    color: LIGHT.textOnNavy,
    fontSize: 14,
    fontWeight: '700',
  },
  detailBadge: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT.emeraldSoft,
    borderColor: '#a7f3d0',
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    marginRight: 36,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  detailBadgeText: {
    color: LIGHT.success,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  field: {
    gap: 6,
  },
  fieldGrow: {
    gap: 6,
    maxHeight: 280,
  },
  titleBox: {
    backgroundColor: LIGHT.emeraldSoft,
    borderColor: '#a7f3d0',
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  titleBoxText: {
    color: LIGHT.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  descScroll: {
    maxHeight: 240,
  },
  descBox: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    padding: 16,
  },
  descBoxText: {
    color: LIGHT.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
});

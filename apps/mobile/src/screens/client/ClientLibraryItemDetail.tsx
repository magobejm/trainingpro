import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { LibraryDisplayItem } from './client-library.helpers';
import { LIGHT } from '../../theme/light';

type Props = {
  item: LibraryDisplayItem | null;
  onClose: () => void;
};

const MODAL_ANIM = 'slide' as const;

export function LibraryItemDetail({ item, onClose }: Props): React.JSX.Element {
  const { t } = useTranslation();

  const handleOpenVideo = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
  };

  const typeLabel = item?.methodType ?? item?.plioType ?? item?.mobilityType ?? item?.isometricType ?? null;
  const bodyText = item?.instructions ?? item?.description ?? null;
  const videoUrl = item?.youtubeUrl ?? null;
  const hasExtra = Boolean(item?.equipment) || Boolean(item?.muscleGroups?.length);

  return (
    <Modal animationType={MODAL_ANIM} onRequestClose={onClose} visible={Boolean(item)}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{item?.name ?? ''}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{'✕'}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {typeLabel ? <Text style={styles.typeChip}>{typeLabel}</Text> : null}

          {hasExtra ? (
            <View style={styles.section}>
              {item?.equipment ? (
                <Text style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{t('client.library.fields.equipment')}</Text>
                  {`  ${item.equipment}`}
                </Text>
              ) : null}
              {item?.muscleGroups?.length ? (
                <Text style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{t('client.library.fields.muscles')}</Text>
                  {`  ${item.muscleGroups.map((m) => m.label).join(', ')}`}
                </Text>
              ) : null}
            </View>
          ) : null}

          {bodyText ? (
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>{t('client.library.fields.instructions')}</Text>
              <Text style={styles.bodyText}>{bodyText}</Text>
            </View>
          ) : null}

          {item?.notes ? (
            <View style={styles.section}>
              <Text style={styles.bodyText}>{item.notes}</Text>
            </View>
          ) : null}

          {videoUrl ? (
            <Pressable onPress={() => handleOpenVideo(videoUrl)} style={styles.videoBtn}>
              <Text style={styles.videoBtnText}>{t('client.library.detail.viewVideo')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20 },
  bodyText: { color: LIGHT.text, fontSize: 14, lineHeight: 21, marginTop: 6 },
  closeBtn: { padding: 8 },
  closeBtnText: { color: LIGHT.textMuted, fontSize: 20 },
  container: { backgroundColor: LIGHT.bgSoft, flex: 1 },
  fieldLabel: { color: LIGHT.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  fieldRow: { color: LIGHT.textStrong, fontSize: 14, marginBottom: 4 },
  header: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderBottomColor: LIGHT.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
  },
  section: { marginBottom: 18 },
  title: { color: LIGHT.textStrong, flex: 1, fontSize: 18, fontWeight: '700' },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusSm,
    color: LIGHT.accentDark,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: 'capitalize',
  },
  videoBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 14,
  },
  videoBtnText: { color: LIGHT.accentDark, fontWeight: '700' },
});

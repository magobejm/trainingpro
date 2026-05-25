import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { LibraryDisplayItem } from './client-library.helpers';

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
  bodyText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 21, marginTop: 6 },
  closeBtn: { padding: 8 },
  closeBtnText: { color: 'rgba(196,181,253,0.7)', fontSize: 20 },
  container: { backgroundColor: '#0d0520', flex: 1 },
  fieldLabel: { color: 'rgba(196,181,253,0.7)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  fieldRow: { color: '#ffffff', fontSize: 14, marginBottom: 4 },
  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(168,85,247,0.2)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
  },
  section: { marginBottom: 18 },
  title: { color: '#ffffff', flex: 1, fontSize: 18, fontWeight: '700' },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168,85,247,0.2)',
    borderRadius: 8,
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: 'capitalize',
  },
  videoBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderColor: '#6366f1',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 14,
  },
  videoBtnText: { color: '#a5b4fc', fontWeight: '700' },
});

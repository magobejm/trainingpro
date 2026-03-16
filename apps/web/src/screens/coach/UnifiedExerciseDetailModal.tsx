import React, { useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, Image } from 'react-native';
import { ChevronLeft, FileText, Dumbbell, Info, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UnifiedExerciseItem } from '../../data/hooks/useUnifiedLibraryQuery';
import { resolvePlaceholder } from './components/LibraryMediaViewer';
import { detailModalStyles as s, theme } from './UnifiedExerciseDetailModal.styles';

const MEDIA_RESIZE_MODE = 'contain' as const;
const MODAL_ANIM = 'fade' as const;
const YT_REGEX = new RegExp(
  '(?:https?:\\/\\/)?(?:www\\.)?(?:youtube\\.com\\/watch\\?v=|' +
  'youtu\\.be\\/|youtube\\.com\\/embed\\/|youtube\\.com\\/shorts\\/)([^& \\n<?]+)',
);

export interface ItemWithExtras extends UnifiedExerciseItem {
  alias?: string;
  equipmentRef?: { label: string };
  movementPatternRef?: { label: string };
  anatomicalPlaneRef?: { label: string };
}

interface MuscleEntry {
  muscleGroup?: { label: string };
  label?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  item: UnifiedExerciseItem | null;
}

function HeroMedia({
  item,
  t,
  youtubeId,
  playingYT,
  setPlayingYT,
}: {
  item: ItemWithExtras;
  t: (k: string) => string;
  youtubeId?: string;
  playingYT: boolean;
  setPlayingYT: (v: boolean) => void;
}) {
  const kind = item.kind === 'exercise' ? 'strength' : item.kind;
  const url = item.mediaUrl || resolvePlaceholder(kind);

  if (playingYT && youtubeId) {
    const src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
    return (
      <View style={s.mediaBox}>
        <iframe
          src={src}
          style={{ width: '100%', height: '100%', border: 'none' }}
          // eslint-disable-next-line no-restricted-syntax
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </View>
    );
  }

  return (
    <View style={s.mediaBox}>
      <Image source={{ uri: url }} style={s.mediaBlur} blurRadius={15} />
      <Image source={{ uri: url }} style={s.mediaMain} resizeMode={MEDIA_RESIZE_MODE} />
      {youtubeId ? (
        // eslint-disable-next-line no-restricted-syntax
        <View style={s.playOverlay} pointerEvents="box-none">
          <Pressable style={s.playBtn} onPress={() => setPlayingYT(true)}>
            {/* eslint-disable-next-line no-restricted-syntax */}
            <Play size={16} fill="#fff" color="#fff" />
            <Text style={s.playBtnText}>{t('coach.library.actions.playTutorial')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function MuscleSection({
  t,
  muscles,
  kind,
  catLabel,
  catValue,
}: {
  t: (k: string) => string;
  muscles: MuscleEntry[];
  kind: string;
  catLabel: string;
  catValue: string;
}) {
  const isStrength = kind === 'exercise' || kind === 'strength';
  return (
    <View style={s.infoCol}>
      <View style={s.sectionHeader}>
        <View style={s.dot} />
        <Text style={s.sectionTitleCap}>{catLabel}</Text>
      </View>
      {isStrength ? (
        <View style={s.tagContainer}>
          {muscles.length > 0 ? (
            muscles.map((mg: MuscleEntry, idx: number) => (
              <View key={idx} style={s.tag}>
                <Text style={s.tagText}>{mg.muscleGroup?.label ?? mg.label ?? ''}</Text>
              </View>
            ))
          ) : (
            <Text style={s.emptyText}>{t('coach.library.detail.noMuscles')}</Text>
          )}
        </View>
      ) : (
        <View style={s.tagContainer}>
          <View style={s.tag}>
            <Text style={s.tagText}>{catValue}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function EquipmentSection({ t, label }: { t: (k: string) => string; label: string }) {
  return (
    <View style={s.infoCol}>
      <View style={s.sectionHeader}>
        <View style={[s.dot, { backgroundColor: theme.colors.primary }]} />
        <Text style={s.sectionTitleCap}>{t('coach.library.detail.equipmentLabel')}</Text>
      </View>
      <View style={s.equipmentCard}>
        <View style={s.equipmentIconBox}>
          {/* eslint-disable-next-line no-restricted-syntax */}
          <Dumbbell size={20} color={'#3b82f6'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.equipmentName}>{label}</Text>
          <Text style={s.equipmentSub}>{t('coach.library.detail.accessoriesLabel')}</Text>
        </View>
      </View>
    </View>
  );
}

function HeroSection({
  item,
  equipmentLabel,
  catLabel,
  catValue,
  youtubeId,
  playingYT,
  setPlayingYT,
  t,
}: {
  item: ItemWithExtras;
  equipmentLabel: string;
  catLabel: string;
  catValue: string;
  youtubeId?: string;
  playingYT: boolean;
  setPlayingYT: (v: boolean) => void;
  t: (k: string) => string;
}) {
  const muscles = (item.muscleGroups ?? []) as MuscleEntry[];
  return (
    <View style={s.heroWrapper}>
      <View style={s.heroLeft}>
        <HeroMedia item={item} t={t} youtubeId={youtubeId} playingYT={playingYT} setPlayingYT={setPlayingYT} />
      </View>
      <View style={s.heroRight}>
        <View style={s.titleRow}>
          <Text style={s.title}>{item.name}</Text>
          {item.alias ? <Text style={s.alias}>{`(${item.alias})`}</Text> : null}
        </View>
        <View style={s.infoGrid}>
          <MuscleSection t={t} muscles={muscles} kind={item.kind} catLabel={catLabel} catValue={catValue} />
          <EquipmentSection t={t} label={equipmentLabel} />
        </View>
      </View>
    </View>
  );
}

function ContentSection({ item, t }: { item: ItemWithExtras; t: (k: string) => string }) {
  return (
    <View style={s.descContainer}>
      {/* Columna Izquierda: Descripción Técnica */}
      <View style={s.descCard}>
        <View style={s.descHeader}>
          {/* eslint-disable-next-line no-restricted-syntax */}
          <FileText size={20} color="#3b82f6" />
          <Text style={s.descTitle}>{t('coach.library.detail.technicalDesc')}</Text>
        </View>
        <Text style={s.descriptionText}>
          {item.instructions || t('coach.library.detail.noDescription')}
        </Text>
      </View>

      {/* Columna Derecha: Indicaciones */}
      <View style={s.descCard}>
        <View style={s.descHeader}>
          {/* eslint-disable-next-line no-restricted-syntax */}
          <Info size={20} color="#3b82f6" />
          <Text style={s.descTitle}>{t('coach.library.detail.coachInstructions')}</Text>
        </View>
        <Text style={s.descriptionText}>
          {item.coachInstructions || t('coach.library.detail.noCoachInstructions')}
        </Text>
      </View>
    </View>
  );
}

function FooterSection({
  patternLabel,
  planeLabel,
  t,
}: {
  patternLabel: string;
  planeLabel: string;
  t: (k: string) => string;
}) {
  return (
    <View style={s.footer}>
      <View style={s.footerItem}>
        <Text style={s.footerLabel}>{t('coach.library.detail.movementPattern')}</Text>
        <Text style={s.footerValue}>{patternLabel}</Text>
      </View>
      <View style={s.footerItem}>
        <Text style={s.footerLabel}>{t('coach.library.detail.anatomicalPlane')}</Text>
        <Text style={s.footerValue}>{planeLabel}</Text>
      </View>
    </View>
  );
}

function resolveLabel(id: string | null | undefined, ref: { label: string } | undefined, fallback: string): string {
  return id ? (ref?.label ?? fallback) : fallback;
}

function useDetailLabels(item: ItemWithExtras, t: (k: string) => string) {
  const kind = item.kind;
  let catLabel = t('coach.library.detail.musclesLabel');
  let catValue = '';

  if (kind === 'cardio') {
    catLabel = t('coach.library.detail.methodLabel');
    catValue = item.methodTypeRef?.label || '';
  } else if (kind === 'plio') {
    catLabel = t('coach.library.detail.plioLabel');
    catValue = item.plioTypeRef?.label || '';
  } else if (kind === 'warmup') {
    catLabel = t('coach.library.detail.mobilityLabel');
    catValue = item.mobilityTypeRef?.label || '';
  } else if (kind === 'sport') {
    catLabel = t('coach.library.detail.sportLabel');
    catValue = item.sportTypeRef?.label || '';
  }

  return {
    catLabel,
    catValue,
    equipmentLabel: resolveLabel(item.equipmentId, item.equipmentRef, t('coach.library.detail.noEquipment')),
    patternLabel: resolveLabel(item.movementPatternId, item.movementPatternRef, t('coach.library.detail.noPattern')),
    planeLabel: resolveLabel(item.anatomicalPlaneId, item.anatomicalPlaneRef, t('coach.library.detail.noPlane')),
  };
}

function ModalContent({ item, t }: { item: ItemWithExtras; t: (k: string) => string }) {
  const { catLabel, catValue, equipmentLabel, patternLabel, planeLabel } = useDetailLabels(item, t);
  const youtubeId = item.youtubeUrl?.match(YT_REGEX)?.[1];
  const [playingYT, setPlayingYT] = useState(false);

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
      <HeroSection
        item={item}
        equipmentLabel={equipmentLabel}
        catLabel={catLabel}
        catValue={catValue}
        youtubeId={youtubeId}
        playingYT={playingYT}
        setPlayingYT={setPlayingYT}
        t={t}
      />
      <ContentSection item={item} t={t} />
      <FooterSection patternLabel={patternLabel} planeLabel={planeLabel} t={t} />
    </ScrollView>
  );
}

export function UnifiedExerciseDetailModal({ visible, onClose, item }: Props) {
  const { t } = useTranslation();
  if (!item) return null;
  const ext = item as ItemWithExtras;
  return (
    <Modal visible={visible} animationType={MODAL_ANIM} transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.container}>
          <View style={s.header}>
            <Pressable onPress={onClose} style={s.backBtn}>
              <ChevronLeft size={20} color={theme.colors.textSecondary} strokeWidth={3} />
              <Text style={s.backText}>{t('coach.library.detail.back')}</Text>
            </Pressable>
          </View>
          <ModalContent item={ext} t={t} />
        </View>
      </View>
    </Modal>
  );
}

import React from 'react';
import { Modal, View, Text, ScrollView, Pressable, Image } from 'react-native';
import { ChevronLeft, FileText, PlayCircle, Dumbbell, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UnifiedExerciseItem } from '../../data/hooks/useUnifiedLibraryQuery';
import { resolvePlaceholder } from './components/LibraryMediaViewer';
import { detailModalStyles as s, theme } from './UnifiedExerciseDetailModal.styles';

const MEDIA_RESIZE_MODE = 'contain' as const;
const MODAL_ANIM = 'fade' as const;
// eslint-disable-next-line max-len
const YT_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^& \n<?]+)/;

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

function MediaBox({ mediaUrl }: { mediaUrl: string }) {
  return (
    <View style={s.mediaBox}>
      <Image source={{ uri: mediaUrl }} style={s.mediaBlur} blurRadius={15} />
      <Image source={{ uri: mediaUrl }} style={s.mediaMain} resizeMode={MEDIA_RESIZE_MODE} />
    </View>
  );
}

function MuscleSection({ t, muscles }: { t: (k: string) => string; muscles: MuscleEntry[] }) {
  return (
    <View style={s.infoCol}>
      <View style={s.sectionHeader}>
        <View style={s.dot} />
        <Text style={s.sectionTitleCap}>{t('coach.library.detail.musclesLabel')}</Text>
      </View>
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
    </View>
  );
}

function EquipmentSection({ t, label }: { t: (k: string) => string; label: string }) {
  return (
    <View style={s.infoCol}>
      <View style={s.sectionHeader}>
        <View style={s.dotSelection} />
        <Text style={s.sectionTitleCap}>{t('coach.library.detail.equipmentLabel')}</Text>
      </View>
      <View style={s.equipmentCard}>
        <View style={s.equipmentIconBox}>
          <Dumbbell size={20} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={s.equipmentName}>{label}</Text>
          <Text style={s.equipmentSub}>{t('coach.library.detail.accessoriesLabel')}</Text>
        </View>
      </View>
    </View>
  );
}

function HeroMedia({ item }: { item: ItemWithExtras }) {
  const kind = item.kind === 'exercise' ? 'strength' : item.kind;
  const url = item.mediaUrl || resolvePlaceholder(kind);
  return <MediaBox mediaUrl={url} />;
}

function HeroSection({
  item,
  equipmentLabel,
  t,
}: {
  item: ItemWithExtras;
  equipmentLabel: string;
  t: (k: string) => string;
}) {
  const muscles = (item.muscleGroups ?? []) as MuscleEntry[];
  return (
    <View style={s.heroWrapper}>
      <View style={s.heroLeft}>
        <HeroMedia item={item} />
      </View>
      <View style={s.heroRight}>
        <View style={s.titleRow}>
          <Text style={s.title}>{item.name}</Text>
          {item.alias ? <Text style={s.alias}>{`(${item.alias})`}</Text> : null}
        </View>
        <View style={s.infoGrid}>
          <MuscleSection t={t} muscles={muscles} />
          <EquipmentSection t={t} label={equipmentLabel} />
        </View>
      </View>
    </View>
  );
}

function VideoCard({ youtubeId, t }: { youtubeId: string; t: (k: string) => string }) {
  const src = `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`;
  const allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  return (
    <View style={s.contentCard}>
      <View style={s.contentCardHeader}>
        <PlayCircle size={18} color={theme.colors.primary} />
        <Text style={s.contentCardTitle}>{t('coach.library.detail.videoTutorial')}</Text>
      </View>
      <View style={s.videoPreview}>
        <iframe
          src={src}
          style={{ width: '100%', height: '100%', border: 'none', minHeight: 200 }}
          allow={allow}
          allowFullScreen
        />
      </View>
    </View>
  );
}

function ContentSection({ item, youtubeId, t }: { item: ItemWithExtras; youtubeId?: string; t: (k: string) => string }) {
  return (
    <View style={s.contentRow}>
      <View style={[s.contentCard, !youtubeId && s.fullWidth]}>
        <View style={s.contentCardHeader}>
          <FileText size={18} color={theme.colors.primary} />
          <View style={s.contentCardTitleWrapper}>
            <Text style={s.contentCardTitle}>{t('coach.library.detail.technicalDesc')}</Text>
            <Info size={14} color={theme.colors.border} />
          </View>
        </View>
        <Text style={s.descriptionText}>{item.instructions ?? t('coach.library.detail.noDescription')}</Text>
      </View>
      {youtubeId ? <VideoCard youtubeId={youtubeId} t={t} /> : null}
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
  return {
    equipmentLabel: resolveLabel(item.equipmentId, item.equipmentRef, t('coach.library.detail.noEquipment')),
    patternLabel: resolveLabel(item.movementPatternId, item.movementPatternRef, t('coach.library.detail.noPattern')),
    planeLabel: resolveLabel(item.anatomicalPlaneId, item.anatomicalPlaneRef, t('coach.library.detail.noPlane')),
  };
}

function ModalContent({ item, t }: { item: ItemWithExtras; t: (k: string) => string }) {
  const { equipmentLabel, patternLabel, planeLabel } = useDetailLabels(item, t);
  const youtubeId = item.youtubeUrl?.match(YT_REGEX)?.[1];
  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
      <HeroSection item={item} equipmentLabel={equipmentLabel} t={t} />
      <ContentSection item={item} youtubeId={youtubeId} t={t} />
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
              <ChevronLeft size={20} color={theme.colors.textSecondary} />
              <Text style={s.backText}>{t('coach.library.detail.back')}</Text>
            </Pressable>
          </View>
          <ModalContent item={ext} t={t} />
        </View>
      </View>
    </Modal>
  );
}

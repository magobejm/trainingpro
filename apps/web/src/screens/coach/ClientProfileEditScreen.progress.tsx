import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { styles } from './ClientProfileEditScreen.styles';
import { pickImageFile } from './client-profile.avatar';
import { buildArchiveBadgeText, photoThumbStyle } from './ClientProfileEditScreen.sections';
import {
  buttonType,
  carouselArrowStyle,
  carouselRailStyle,
  carouselWrapStyle,
  draggablePhotoStyle,
  emptyAlt,
  envelopeStyle,
  formatPhotoDate,
  ICON_MAGNIFIER,
  ICON_NEXT,
  ICON_PREV,
  resolvePhotoUrl,
  scrollRail,
  type ProgressPhoto,
} from './ClientProfileEditScreen.utils';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function ProgressPhotosPanel(props: {
  archivePhoto: (photoId: string) => Promise<unknown>;
  archivedPhotos: ProgressPhoto[];
  draggedPhotoId: string;
  formatLocale: string;
  hoveredPhotoId: string;
  labels: ProgressLabels;
  photoRailRef: React.RefObject<HTMLDivElement | null>;
  restorePhoto: (photoId: string) => Promise<unknown>;
  setDraggedPhotoId: React.Dispatch<React.SetStateAction<string>>;
  setGalleryIndex: React.Dispatch<React.SetStateAction<null | number>>;
  setHoveredPhotoId: React.Dispatch<React.SetStateAction<string>>;
  setShowArchivedPhotos: React.Dispatch<React.SetStateAction<boolean>>;
  showArchivedPhotos: boolean;
  t: Translate;
  uploadPhoto: (file: File) => Promise<unknown>;
  visiblePhotos: ProgressPhoto[];
}): React.JSX.Element {
  return (
    <View style={styles.card}>
      <ProgressActions {...props} />
      <ProgressVisibleRail {...props} />
      <Text style={styles.helperText}>{props.labels.openGalleryHint}</Text>
      {props.showArchivedPhotos ? <ArchivedPanel {...props} /> : null}
    </View>
  );
}

type ProgressLabels = {
  archived: string;
  archivedEmpty: string;
  archivedHint: string;
  archivedTitle: string;
  openGalleryHint: string;
  progressPhotos: string;
  restore: string;
  visible: string;
};

function ProgressActions(
  props: React.ComponentProps<typeof ProgressPhotosPanel>,
): React.JSX.Element {
  return (
    <>
      <Text style={styles.label}>{props.labels.progressPhotos}</Text>
      <View style={styles.row}>
        <UploadPhotoButton t={props.t} uploadPhoto={props.uploadPhoto} />
        <ArchiveDropBadge {...props} />
      </View>
      <Text style={styles.label}>{props.labels.visible}</Text>
    </>
  );
}

function UploadPhotoButton(props: {
  t: Translate;
  uploadPhoto: (file: File) => Promise<unknown>;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={() => void onUploadProgressPhoto(props.uploadPhoto)}
      style={styles.secondaryButton}
    >
      <Text style={styles.secondaryLabel}>{props.t('coach.clientProfile.avatar.upload')}</Text>
    </Pressable>
  );
}

function onUploadProgressPhoto(uploadPhoto: (file: File) => Promise<unknown>): Promise<unknown> {
  return pickImageFile().then((file) => {
    if (!file) return;
    return uploadPhoto(file);
  });
}

function ArchiveDropBadge(
  props: React.ComponentProps<typeof ProgressPhotosPanel>,
): React.JSX.Element {
  const text = buildArchiveBadgeText(props.labels.archived, props.archivedPhotos.length);
  return (
    <div
      onClick={() => props.setShowArchivedPhotos((prev) => !prev)}
      onDragOver={preventDropDefault}
      onDrop={(event) =>
        void onArchiveDrop(event, props.draggedPhotoId, props.archivePhoto, props.setDraggedPhotoId)
      }
      style={envelopeStyle}
      title={props.labels.archived}
    >
      {text}
    </div>
  );
}

function preventDropDefault(event: React.DragEvent<HTMLDivElement>): void {
  event.preventDefault();
}

function onArchiveDrop(
  event: React.DragEvent<HTMLDivElement>,
  draggedPhotoId: string,
  archivePhoto: (photoId: string) => Promise<unknown>,
  setDraggedPhotoId: React.Dispatch<React.SetStateAction<string>>,
): Promise<void> {
  event.preventDefault();
  if (!draggedPhotoId) return Promise.resolve();
  return archivePhoto(draggedPhotoId).then(() => setDraggedPhotoId('')) as Promise<void>;
}

function ProgressVisibleRail(
  props: React.ComponentProps<typeof ProgressPhotosPanel>,
): React.JSX.Element {
  return (
    <div style={carouselWrapStyle}>
      <button
        onClick={() => scrollRail(props.photoRailRef.current, -300)}
        style={carouselArrowStyle}
        type={buttonType}
      >
        {ICON_PREV}
      </button>
      <div ref={props.photoRailRef} style={carouselRailStyle}>
        {props.visiblePhotos.map((item, index) => (
          <ProgressThumb key={item.id} index={index} item={item} {...props} />
        ))}
      </div>
      <button
        onClick={() => scrollRail(props.photoRailRef.current, 300)}
        style={carouselArrowStyle}
        type={buttonType}
      >
        {ICON_NEXT}
      </button>
    </div>
  );
}

function ProgressThumb(
  props: React.ComponentProps<typeof ProgressPhotosPanel> & { index: number; item: ProgressPhoto },
): React.JSX.Element {
  return (
    <div
      draggable
      key={props.item.id}
      onDragStart={() => props.setDraggedPhotoId(props.item.id)}
      style={draggablePhotoStyle}
    >
      <View style={styles.photoCard}>
        <ThumbButton {...props} />
        <Text style={styles.photoDate}>{thumbDate(props)}</Text>
      </View>
    </div>
  );
}

function ThumbButton(props: {
  index: number;
  item: ProgressPhoto;
  hoveredPhotoId: string;
  setGalleryIndex: React.Dispatch<React.SetStateAction<null | number>>;
  setHoveredPhotoId: React.Dispatch<React.SetStateAction<string>>;
}): React.JSX.Element {
  const hovered = props.hoveredPhotoId === props.item.id;
  return (
    <Pressable
      onHoverIn={() => props.setHoveredPhotoId(props.item.id)}
      onHoverOut={() => props.setHoveredPhotoId('')}
      onPress={() => props.setGalleryIndex(props.index)}
      style={styles.photoThumbButton}
    >
      <img
        alt={emptyAlt}
        src={resolvePhotoUrl(props.item.imageUrl, props.item.imagePath)}
        style={photoThumbStyle(hovered)}
      />
      {hovered ? <HoverMagnifier /> : null}
    </Pressable>
  );
}

function thumbDate(props: {
  formatLocale: string;
  item: ProgressPhoto;
  labels: ProgressLabels;
}): string {
  return formatPhotoDate(props.item.createdAt, props.formatLocale, props.labels.archivedHint);
}

function HoverMagnifier(): React.JSX.Element {
  return (
    <View style={styles.photoOverlay}>
      <Text style={styles.photoOverlayIcon}>{ICON_MAGNIFIER}</Text>
    </View>
  );
}

function ArchivedPanel(props: React.ComponentProps<typeof ProgressPhotosPanel>): React.JSX.Element {
  return (
    <View style={styles.archivedPanel}>
      <Text style={styles.label}>{props.labels.archivedTitle}</Text>
      {props.archivedPhotos.length === 0 ? (
        <Text style={styles.helperText}>{props.labels.archivedEmpty}</Text>
      ) : (
        <ArchivedList {...props} />
      )}
    </View>
  );
}

function ArchivedList(props: React.ComponentProps<typeof ProgressPhotosPanel>): React.JSX.Element {
  return (
    <View style={styles.archivedList}>
      {props.archivedPhotos.map((item) => (
        <ArchivedRow
          formatLocale={props.formatLocale}
          item={item}
          labels={props.labels}
          onRestore={props.restorePhoto}
          key={item.id}
        />
      ))}
    </View>
  );
}

function ArchivedRow(props: {
  formatLocale: string;
  item: ProgressPhoto;
  labels: ProgressLabels;
  onRestore: (photoId: string) => Promise<unknown>;
}): React.JSX.Element {
  const subtitleDate = formatPhotoDate(
    props.item.createdAt,
    props.formatLocale,
    props.labels.archivedHint,
  );
  return (
    <View style={styles.archivedRow}>
      <View style={styles.archivedLeft}>
        <Image
          source={{ uri: resolvePhotoUrl(props.item.imageUrl, props.item.imagePath) }}
          style={styles.archivedThumb}
        />
        <View>
          <Text style={styles.archivedTitle}>{props.labels.archivedTitle}</Text>
          <Text style={styles.archivedSubtitle}>{props.labels.archivedHint}</Text>
          <Text style={styles.archivedSubtitle}>{subtitleDate}</Text>
        </View>
      </View>
      <Pressable onPress={() => void props.onRestore(props.item.id)} style={styles.secondaryButton}>
        <Text style={styles.secondaryLabel}>{props.labels.restore}</Text>
      </Pressable>
    </View>
  );
}

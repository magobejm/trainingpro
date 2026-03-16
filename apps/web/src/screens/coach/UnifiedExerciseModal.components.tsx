import React from 'react';
import { View, Text, Pressable, TextInput, Image, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { X, UploadCloud, PlayCircle, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SelectOption, MODAL_THEME } from './UnifiedExerciseModal.types';
import { UnifiedExerciseFormState } from './hooks/useUnifiedExerciseForm';
import { styles } from './UnifiedExerciseModal.styles';

type TFn = (key: string) => string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandleChange = (k: any, v: any) => void;

export interface MediaProps {
  formState: UnifiedExerciseFormState;
  handleChange: <K extends keyof UnifiedExerciseFormState>(key: K, value: UnifiedExerciseFormState[K]) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  youtubeId?: string | null;
  videoPlaying?: boolean;
  setVideoPlaying?: (playing: boolean) => void;
  closeMuscles: () => void;
  t: (k: string) => string;
  onlyImage?: boolean;
  onlyVideo?: boolean;
  style?: ViewStyle;
}

export interface EquipmentProps {
  equipmentId: string | null | undefined;
  options: SelectOption[];
  onChange: (v: string) => void;
  onFocus: () => void;
  t: TFn;
  style?: ViewStyle;
}

export interface BasicInfoProps {
  name: string;
  category: string;
  categories: SelectOption[];
  onChange: HandleChange;
  onFocus: () => void;
  t: TFn;
  style?: ViewStyle;
}

export interface CatFieldsProps {
  formState: UnifiedExerciseFormState;
  mappedCatalogs: { [k: string]: SelectOption[] | undefined };
  musclesExpanded: boolean;
  setMusclesExpanded: (v: boolean) => void;
  toggleMuscleGroup: (id: string) => void;
  handleChange: HandleChange;
  onFocus: () => void;
  t: TFn;
}

export interface DescProps {
  instructions: string | null | undefined;
  coachInstructions: string | null | undefined;
  onChange: HandleChange;
  onFocus: () => void;
  t: TFn;
  style?: StyleProp<ViewStyle>;
}

export interface BioProps {
  movementPatternId: string | null | undefined;
  anatomicalPlaneId: string | null | undefined;
  mappedCatalogs: {
    movementPatterns?: SelectOption[];
    anatomicalPlanes?: SelectOption[];
  };
  onChange: HandleChange;
  onFocus: () => void;
  t: TFn;
  style?: StyleProp<ViewStyle>;
}

export interface HeaderProps {
  isEdit: boolean;
  onSave: () => void;
  onClose: () => void;
  isPending: boolean;
  canSave: boolean;
  t: TFn;
}

export interface ErrorBannerProps {
  message: string;
  onClose: () => void;
  t: TFn;
}

const ICON_COLOR_DANGER = '#991b1b';
const ICON_COLOR_WHITE = '#fff';

export function CustomButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}) {
  const isPrimary = variant === 'primary';
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[
        styles.btnBase,
        isPrimary ? styles.btnPrimary : styles.btnOutline,
        (disabled || loading) && styles.btnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text style={[styles.btnText, isPrimary ? styles.btnTextPrimary : styles.btnTextOutline]}>
        {loading ? t('common.loading') : title}
      </Text>
    </TouchableOpacity>
  );
}

export function ModalHeader({ isEdit, onSave, onClose, isPending, canSave, t }: HeaderProps) {
  const title = isEdit ? t('coach.library.modal.editTitle') : t('coach.library.modal.createTitle');
  const saveTitle = isEdit ? t('coach.library.actions.saveChanges') : t('coach.library.actions.createExercise');
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <ChevronLeft size={24} color={MODAL_THEME.colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>
      <CustomButton title={saveTitle} onPress={onSave} loading={isPending} disabled={!canSave} />
    </View>
  );
}

export function ErrorBanner({ message, t, onClose }: ErrorBannerProps) {
  return (
    <View style={styles.errorBanner}>
      <X size={16} color={MODAL_THEME.colors.danger} />
      <Text style={styles.errorText}>{t(message)}</Text>
      <TouchableOpacity onPress={onClose} style={styles.errorClose}>
        <X size={14} color={ICON_COLOR_DANGER} />
      </TouchableOpacity>
    </View>
  );
}

const FILE_TYPE = 'file' as const;
const ACCEPT_IMAGES = 'image/*' as const;

function ImagePreview({ uri, mediaHelp, t }: { uri?: string | null; mediaHelp: string; t: TFn }) {
  if (uri) {
    return (
      <View style={styles.mediaPreviewContainer}>
        <Image source={{ uri }} style={styles.mediaPreviewBlur} blurRadius={15} />
        <Image source={{ uri }} style={styles.mediaPreviewContain} />
      </View>
    );
  }
  return (
    <>
      <View style={styles.mediaUploadIconWrapper}>
        <UploadCloud size={28} color={MODAL_THEME.colors.primary} />
      </View>
      <Text style={styles.mediaUploadTitle}>{t('common.uploadOrSelect')}</Text>
      <Text style={styles.mediaHelp}>{mediaHelp}</Text>
    </>
  );
}

function MediaImageSection({
  formState,
  fileInputRef,
  handleFileChange,
  closeMuscles,
  t,
}: Omit<MediaProps, 'youtubeId' | 'videoPlaying' | 'setVideoPlaying' | 'handleChange'> & {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const triggerFilePicker = () => {
    closeMuscles();
    if (fileInputRef.current) fileInputRef.current.click();
  };
  return (
    <View style={styles.cardContainer}>
      <View style={styles.fieldSection}>
        <Text style={styles.label}>{t('coach.library.fields.imageLabel')}</Text>
        <input
          type={FILE_TYPE}
          ref={fileInputRef as React.RefObject<HTMLInputElement>}
          style={{ display: 'none' }}
          accept={ACCEPT_IMAGES}
          onChange={handleFileChange}
        />
        <Pressable style={styles.mediaBox} onPress={triggerFilePicker}>
          <ImagePreview uri={formState.mediaUrl} mediaHelp={t('coach.library.fields.imageHelp')} t={t} />
        </Pressable>
      </View>
    </View>
  );
}

const YT_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' as const;

function YTPlayer({
  youtubeId,
  videoPlaying,
  setVideoPlaying,
}: {
  youtubeId: string;
  videoPlaying: boolean;
  setVideoPlaying: (v: boolean) => void;
}) {
  const thumbUri = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  return (
    <Pressable style={styles.videoPreview} onPress={() => setVideoPlaying(true)} disabled={videoPlaying}>
      {videoPlaying ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow={YT_ALLOW}
          allowFullScreen
        />
      ) : (
        <>
          <View style={styles.mediaPreviewContainer}>
            <Image source={{ uri: thumbUri }} style={styles.mediaPreviewBlur} blurRadius={15} />
            <Image source={{ uri: thumbUri }} style={styles.mediaPreviewContain} />
          </View>
          <View style={styles.playIconOverlay}>
            <PlayCircle size={48} color={ICON_COLOR_WHITE} />
          </View>
        </>
      )}
    </Pressable>
  );
}

function MediaVideoSection({
  formState,
  handleChange,
  youtubeId,
  videoPlaying = false,
  setVideoPlaying = () => { },
  closeMuscles,
  t,
}: Omit<MediaProps, 'fileInputRef' | 'handleFileChange'>) {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.fieldSection}>
        <Text style={styles.label}>{t('coach.library.fields.videoLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('coach.library.fields.videoPlaceholder')}
          value={(formState.youtubeUrl as string) || ''}
          onChangeText={(v) => handleChange('youtubeUrl', v)}
          onFocus={closeMuscles}
        />
      </View>
      {youtubeId && (
        <View style={[styles.fieldSection, styles.videoPreviewWrapper]}>
          <YTPlayer youtubeId={youtubeId} videoPlaying={videoPlaying} setVideoPlaying={setVideoPlaying} />
        </View>
      )}
    </View>
  );
}

export function MediaSection(props: MediaProps) {
  const { onlyImage, onlyVideo } = props;
  return (
    <>
      {!onlyVideo && props.fileInputRef && props.handleFileChange && (
        <MediaImageSection
          {...props}
          fileInputRef={props.fileInputRef!}
          handleFileChange={props.handleFileChange!}
        />
      )}
      {!onlyImage && (
        <MediaVideoSection {...props} />
      )}
    </>
  );
}

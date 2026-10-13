import React from 'react';
import { View, Text, Pressable, Image, StyleProp, ViewStyle } from 'react-native';
import { X, UploadCloud, PlayCircle } from 'lucide-react';
import { SelectOption } from './UnifiedExerciseModal.types';
import { UnifiedExerciseFormState } from './hooks/useUnifiedExerciseForm';
import { styles } from './UnifiedExerciseModal.styles';
import { IconButton, TextField, colors } from '@trainerpro/ui';

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

export interface ErrorBannerProps {
  message: string;
  onClose: () => void;
  t: TFn;
}

const ICON_COLOR_DANGER = colors.danger;
const ICON_COLOR_WHITE = colors.onPrimary;

export function ErrorBanner({ message, t, onClose }: ErrorBannerProps) {
  return (
    <View style={styles.errorBanner}>
      <X size={16} color={ICON_COLOR_DANGER} />
      <Text style={styles.errorText}>{t(message)}</Text>
      <IconButton
        accessibilityLabel={t('common.close')}
        icon={(color) => <X size={14} color={color} />}
        onPress={onClose}
        size={28}
        tone="danger"
      />
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
        <UploadCloud size={28} color={colors.primary} />
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
  setVideoPlaying = () => {},
  closeMuscles,
  t,
}: Omit<MediaProps, 'fileInputRef' | 'handleFileChange'>) {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.fieldSection}>
        <TextField
          label={t('coach.library.fields.videoLabel')}
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
        <MediaImageSection {...props} fileInputRef={props.fileInputRef!} handleFileChange={props.handleFileChange!} />
      )}
      {!onlyImage && <MediaVideoSection {...props} />}
    </>
  );
}

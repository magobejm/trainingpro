import React, { useState, useRef, useCallback } from 'react';
import { Modal, View, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  useUnifiedExerciseForm,
  UnifiedExerciseItem as FormInitialItem,
  ExerciseCategory,
} from './hooks/useUnifiedExerciseForm';
import { useAllCatalogsQuery } from '../../data/hooks/useUnifiedLibraryQuery';
import { UnifiedExerciseModalProps } from './UnifiedExerciseModal.types';
import { styles } from './UnifiedExerciseModal.styles';
import { ModalHeader, ErrorBanner, MediaSection, ModalFooter } from './UnifiedExerciseModal.components';
import {
  EquipmentSection,
  BasicInfoSection,
  CategorySpecificFields,
  DescriptionSection,
  BiomechanicsSection,
} from './UnifiedExerciseModal.fields';
import { useExerciseModalSave } from './hooks/useExerciseModalSave';
import { useExerciseModalData } from './hooks/useExerciseModalData';

const ANIM_FADE = 'fade' as const;
const TAPS_HANDLED = 'handled' as const;

function useModalFileHandler(
  form: ReturnType<typeof useUnifiedExerciseForm>,
  setSelectedFile: (f: File | null) => void,
  setErrorMessage: (m: string | null) => void,
  closeMuscles: () => void,
) {
  return useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSelectedFile(file);
      setErrorMessage(null);
      form.handleChange('mediaUrl', URL.createObjectURL(file));
      closeMuscles();
    },
    [form, setSelectedFile, setErrorMessage, closeMuscles],
  );
}

function useModalState(
  itemToEdit: FormInitialItem | null | undefined,
  defaultCategory: ExerciseCategory | undefined,
  onClose: () => void,
) {
  const { t } = useTranslation();
  const { data: catalogs } = useAllCatalogsQuery();
  const form = useUnifiedExerciseForm(itemToEdit as FormInitialItem, defaultCategory);
  const [musclesExpanded, setMusclesExpanded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeMuscles = useCallback(() => setMusclesExpanded(false), []);
  const onSuccess = useCallback(() => {
    form.reset();
    setSelectedFile(null);
    onClose();
  }, [form, onClose]);
  const saveHook = useExerciseModalSave({ formState: form.formState, selectedFile, itemToEdit, onSuccess });
  const modalData = useExerciseModalData({ catalogs, formState: form.formState, t, setVideoPlaying });
  const handleFileChange = useModalFileHandler(form, setSelectedFile, saveHook.setErrorMessage, closeMuscles);
  return {
    t,
    form,
    musclesExpanded,
    setMusclesExpanded,
    videoPlaying,
    setVideoPlaying,
    fileInputRef,
    closeMuscles,
    saveHook,
    modalData,
    handleFileChange,
  };
}

export function UnifiedExerciseModal({ visible, onClose, itemToEdit, defaultCategory }: UnifiedExerciseModalProps) {
  const st = useModalState(itemToEdit, defaultCategory, onClose);
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType={ANIM_FADE}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ModalHeader isEdit={!!itemToEdit} onClose={onClose} t={st.t} />
          {st.saveHook.errorMessage && (
            <ErrorBanner message={st.saveHook.errorMessage} t={st.t} onClose={() => st.saveHook.setErrorMessage(null)} />
          )}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps={TAPS_HANDLED}
          >
            <FormColumns st={st} />
          </ScrollView>
          <ModalFooter
            isEdit={!!itemToEdit}
            onSave={st.saveHook.handleSave}
            onClose={onClose}
            isPending={st.saveHook.isPending}
            canSave={!!st.form.formState.name.trim()}
            t={st.t}
          />
        </View>
      </View>
    </Modal>
  );
}

function FormColumns({ st }: { st: ReturnType<typeof useModalState> }) {
  return (
    <View style={styles.columns}>
      <FormLeftColumn st={st} />
      <FormRightColumn st={st} />
    </View>
  );
}

function FormLeftColumn({ st }: { st: ReturnType<typeof useModalState> }) {
  const { form, modalData: md, t } = st;
  const formState = form.formState;
  return (
    <View style={styles.leftCol}>
      <MediaSection
        formState={formState}
        handleChange={form.handleChange}
        fileInputRef={st.fileInputRef}
        handleFileChange={st.handleFileChange}
        youtubeId={md.youtubeId}
        videoPlaying={st.videoPlaying}
        setVideoPlaying={st.setVideoPlaying}
        closeMuscles={st.closeMuscles}
        t={t}
      />
      <EquipmentSection
        equipmentId={formState.equipmentId}
        options={md.mappedCatalogs.equipment || []}
        onChange={(v: string) => form.handleChange('equipmentId', v)}
        onFocus={st.closeMuscles}
        t={t}
      />
    </View>
  );
}

function FormRightColumn({ st }: { st: ReturnType<typeof useModalState> }) {
  const { form, modalData: md, t } = st;
  const formState = form.formState;
  return (
    <View style={styles.rightCol}>
      <BasicInfoSection
        name={formState.name}
        category={formState.category}
        categories={md.categories}
        onChange={form.handleChange}
        onFocus={st.closeMuscles}
        t={t}
      />
      <CategorySpecificFields
        formState={formState}
        mappedCatalogs={md.mappedCatalogs}
        musclesExpanded={st.musclesExpanded}
        setMusclesExpanded={st.setMusclesExpanded}
        toggleMuscleGroup={form.toggleMuscleGroup}
        handleChange={form.handleChange}
        onFocus={st.closeMuscles}
        t={t}
      />
      <DescriptionSection
        instructions={formState.instructions}
        onChange={(v: string) => form.handleChange('instructions', v)}
        onFocus={st.closeMuscles}
        t={t}
      />
      <BiomechanicsSection
        movementPatternId={formState.movementPatternId}
        anatomicalPlaneId={formState.anatomicalPlaneId}
        mappedCatalogs={md.mappedCatalogs}
        onChange={form.handleChange}
        onFocus={st.closeMuscles}
        t={t}
      />
    </View>
  );
}

import React, { useState, useRef, useCallback } from 'react';
import { Modal, View, ScrollView, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  useUnifiedExerciseForm,
  UnifiedExerciseItem as FormInitialItem,
  ExerciseCategory,
} from './hooks/useUnifiedExerciseForm';
import { useAllCatalogsQuery } from '../../data/hooks/useUnifiedLibraryQuery';
import { UnifiedExerciseModalProps } from './UnifiedExerciseModal.types';
import { styles } from './UnifiedExerciseModal.styles';
import { FormSelect } from './components/UnifiedExerciseFormSelect';
import { ModalHeader, ErrorBanner, MediaSection } from './UnifiedExerciseModal.components';
import {
  EquipmentSection,
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
          <ModalHeader
            isEdit={!!itemToEdit}
            onSave={st.saveHook.handleSave}
            onClose={onClose}
            isPending={st.saveHook.isPending}
            canSave={!!st.form.formState.name.trim()}
            t={st.t}
          />
          {st.saveHook.errorMessage && (
            <ErrorBanner message={st.saveHook.errorMessage} t={st.t} onClose={() => st.saveHook.setErrorMessage(null)} />
          )}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps={TAPS_HANDLED}
          >
            <FormRows st={st} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FormRow1({ st }: { st: ReturnType<typeof useModalState> }) {
  const { form, modalData: md, t } = st;
  const formState = form.formState;
  return (
    <View style={[styles.gridRow, { zIndex: 100 }]}>
      <View style={[styles.gridColLeft, { zIndex: 90 }]}>
        <MediaSection
          formState={formState}
          handleChange={form.handleChange}
          fileInputRef={st.fileInputRef}
          handleFileChange={st.handleFileChange}
          closeMuscles={st.closeMuscles}
          t={t}
          onlyImage
        />
      </View>
      <View style={[styles.gridColRight, { zIndex: 100 }]}>
        <View style={[styles.cardContainer, { zIndex: 100, marginBottom: 0 }]}>
          <View style={styles.fieldSection}>
            <Text style={styles.label}>{t('coach.library.fields.nameLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('coach.library.fields.namePlaceholder')}
              value={formState.name}
              onChangeText={(v) => form.handleChange('name', v)}
              onFocus={st.closeMuscles}
            />
          </View>
          <View style={[styles.row, { zIndex: 90 }]}>
            <View style={[{ flex: 1, marginRight: 12, zIndex: 100 }]}>
              <Text style={styles.label}>{t('coach.library.fields.categoryLabel')}</Text>
              <FormSelect
                options={md.categories}
                value={formState.category}
                placeholder={''}
                onSelect={(val) => form.handleChange('category', val as ExerciseCategory)}
                onFocus={st.closeMuscles}
              />
            </View>
            <View style={[{ flex: 1, marginLeft: 12, zIndex: 90 }]}>
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
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function FormRows({ st }: { st: ReturnType<typeof useModalState> }) {
  const { form, modalData: md, t } = st;
  const formState = form.formState;
  return (
    <View style={{ flexDirection: 'column' }}>
      <FormRow1 st={st} />

      {/* Fila 2: Video (Izquierda) + Descripciones (Derecha) */}
      <View style={[styles.gridRow, { zIndex: 80 }]}>
        <View style={[styles.gridColLeft, { zIndex: 80 }]}>
          <MediaSection
            formState={formState}
            handleChange={form.handleChange}
            youtubeId={md.youtubeId}
            videoPlaying={st.videoPlaying}
            setVideoPlaying={st.setVideoPlaying}
            closeMuscles={st.closeMuscles}
            t={t}
            onlyVideo
          />
        </View>
        <View style={[styles.gridColRight, { zIndex: 80 }]}>
          <DescriptionSection
            instructions={formState.instructions}
            coachInstructions={formState.coachInstructions}
            onChange={form.handleChange}
            onFocus={st.closeMuscles}
            t={t}
            style={{ marginBottom: 0 }}
          />
        </View>
      </View>

      {/* Fila 3: Equipamiento (Izquierda) + Biomecánica (Derecha) */}
      <View style={[styles.gridRow, { zIndex: 70 }]}>
        <View style={[styles.gridColLeft, { zIndex: 70 }]}>
          <EquipmentSection
            equipmentId={formState.equipmentId}
            options={md.mappedCatalogs.equipment || []}
            onChange={(v: string) => form.handleChange('equipmentId', v)}
            onFocus={st.closeMuscles}
            t={t}
            style={{ marginBottom: 0 }}
          />
        </View>
        <View style={[styles.gridColRight, { zIndex: 70 }]}>
          <BiomechanicsSection
            movementPatternId={formState.movementPatternId}
            anatomicalPlaneId={formState.anatomicalPlaneId}
            mappedCatalogs={md.mappedCatalogs}
            onChange={form.handleChange}
            onFocus={st.closeMuscles}
            t={t}
            style={{ marginBottom: 0 }}
          />
        </View>
      </View>
    </View>
  );
}

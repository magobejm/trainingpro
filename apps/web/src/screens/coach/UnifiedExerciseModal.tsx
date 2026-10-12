import React, { useState, useRef, useCallback } from 'react';
import { View } from 'react-native';
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
import { ErrorBanner, MediaSection } from './UnifiedExerciseModal.components';
import {
  EquipmentSection,
  CategorySpecificFields,
  DescriptionSection,
  BiomechanicsSection,
} from './UnifiedExerciseModal.fields';
import { useExerciseModalSave } from './hooks/useExerciseModalSave';
import { useExerciseModalData } from './hooks/useExerciseModalData';
import { Button, Modal, TextField, space } from '@trainerpro/ui';

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
  const isEdit = !!itemToEdit;
  const { t } = st;
  return (
    <Modal
      closeLabel={t('common.close')}
      footer={
        <>
          <Button label={t('common.cancel')} onPress={onClose} variant="secondary" />
          <Button
            disabled={!st.form.formState.name.trim()}
            label={isEdit ? t('coach.library.actions.saveChanges') : t('coach.library.actions.createExercise')}
            loading={st.saveHook.isPending}
            onPress={st.saveHook.handleSave}
          />
        </>
      }
      onClose={onClose}
      size="xl"
      title={isEdit ? t('coach.library.modal.editTitle') : t('coach.library.modal.createTitle')}
      visible={visible}
    >
      {st.saveHook.errorMessage && (
        <ErrorBanner message={st.saveHook.errorMessage} t={t} onClose={() => st.saveHook.setErrorMessage(null)} />
      )}
      <FormRows st={st} />
    </Modal>
  );
}

function FormRow1({ st }: { st: ReturnType<typeof useModalState> }) {
  const { form, modalData: md, t } = st;
  const [nameTouched, setNameTouched] = useState(false);
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
            <TextField
              error={nameTouched && !formState.name.trim() ? t('coach.clientProfile.validation.required') : null}
              label={t('coach.library.fields.nameLabel')}
              onBlur={() => setNameTouched(true)}
              onChangeText={(v) => form.handleChange('name', v)}
              onFocus={st.closeMuscles}
              placeholder={t('coach.library.fields.namePlaceholder')}
              required
              value={formState.name}
            />
          </View>
          <View style={[styles.row, { zIndex: 90 }]}>
            <View style={[{ flex: 1, marginRight: space.md, zIndex: 100 }]}>
              <FormSelect
                label={t('coach.library.fields.categoryLabel')}
                options={md.categories}
                value={formState.category}
                placeholder={''}
                onSelect={(val) => form.handleChange('category', val as ExerciseCategory)}
                onFocus={st.closeMuscles}
              />
            </View>
            <View style={[{ flex: 1, marginLeft: space.md, zIndex: 90 }]}>
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

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { FormSelect } from './components/UnifiedExerciseFormSelect';
import { MuscleMultiSelect } from './components/MuscleMultiSelect';
import { ExerciseCategory } from './hooks/useUnifiedExerciseForm';
import { styles } from './UnifiedExerciseModal.styles';
import { EquipmentProps, BasicInfoProps, CatFieldsProps, DescProps, BioProps } from './UnifiedExerciseModal.components';

export function EquipmentSection({ equipmentId, options, onChange, onFocus, t }: EquipmentProps) {
  return (
    <View style={styles.fieldSection}>
      <Text style={styles.label}>{t('coach.library.fields.equipmentLabel')}</Text>
      <FormSelect
        options={options}
        value={equipmentId}
        onSelect={onChange}
        placeholder={t('coach.library.fields.unspecified')}
        onFocus={onFocus}
      />
    </View>
  );
}

const EMPTY_CAT = '' as const;

export function BasicInfoSection({ name, category, categories, onChange, onFocus, t }: BasicInfoProps) {
  return (
    <>
      <View style={styles.fieldSection}>
        <Text style={styles.label}>{t('coach.library.fields.nameLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('coach.library.fields.namePlaceholder')}
          value={name}
          onChangeText={(v) => onChange('name', v)}
          onFocus={onFocus}
        />
      </View>
      <View style={[styles.fieldSection, { zIndex: 100 }]}>
        <Text style={styles.label}>{t('coach.library.fields.categoryLabel')}</Text>
        <FormSelect
          options={categories}
          value={category}
          placeholder={EMPTY_CAT}
          onSelect={(val) => onChange('category', val as ExerciseCategory)}
          onFocus={onFocus}
        />
      </View>
    </>
  );
}

function StrengthFields({ props }: { props: CatFieldsProps }) {
  return (
    <>
      <Text style={styles.label}>{props.t('coach.library.fields.musclesLabel')}</Text>
      <MuscleMultiSelect
        options={props.mappedCatalogs.muscles || []}
        selectedIds={props.formState.muscleGroupIds}
        onToggle={props.toggleMuscleGroup}
        expanded={props.musclesExpanded}
        setExpanded={props.setMusclesExpanded}
        placeholder={props.t('coach.library.fields.musclesPlaceholder')}
        closeLabel={props.t('common.close')}
      />
    </>
  );
}

function CardioPlioFields({ props, u }: { props: CatFieldsProps; u: string }) {
  const { formState, mappedCatalogs, handleChange, onFocus, t } = props;
  if (formState.category === 'cardio') {
    return (
      <>
        <Text style={styles.label}>{t('coach.library.fields.cardioTypeLabel')}</Text>
        <FormSelect
          options={mappedCatalogs.cardioTypes || []}
          value={formState.cardioTypeId}
          onSelect={(v) => handleChange('cardioTypeId', v)}
          placeholder={u}
          onFocus={onFocus}
        />
      </>
    );
  }
  return (
    <>
      <Text style={styles.label}>{t('coach.library.fields.plioTypeLabel')}</Text>
      <FormSelect
        options={mappedCatalogs.plioTypes || []}
        value={formState.plioTypeId}
        onSelect={(v) => handleChange('plioTypeId', v)}
        placeholder={u}
        onFocus={onFocus}
      />
    </>
  );
}

function WarmupSportFields({ props, u }: { props: CatFieldsProps; u: string }) {
  const { formState, mappedCatalogs, handleChange, onFocus, t } = props;
  if (formState.category === 'warmup') {
    return (
      <>
        <Text style={styles.label}>{t('coach.library.fields.mobilityTypeLabel')}</Text>
        <FormSelect
          options={mappedCatalogs.mobilityTypes || []}
          value={formState.mobilityTypeId}
          onSelect={(v) => handleChange('mobilityTypeId', v)}
          placeholder={u}
          onFocus={onFocus}
        />
      </>
    );
  }
  return (
    <>
      <Text style={styles.label}>{t('coach.library.fields.sportTypeLabel')}</Text>
      <FormSelect
        options={mappedCatalogs.sportTypes || []}
        value={formState.sportTypeId}
        onSelect={(v) => handleChange('sportTypeId', v)}
        placeholder={u}
        onFocus={onFocus}
      />
    </>
  );
}

export function CategorySpecificFields(props: CatFieldsProps) {
  const cat = props.formState.category;
  const u = props.t('coach.library.fields.unspecified');
  return (
    <View style={[styles.fieldSection, { zIndex: 90 }]}>
      {cat === 'strength' && <StrengthFields props={props} />}
      {(cat === 'cardio' || cat === 'plio') && <CardioPlioFields props={props} u={u} />}
      {(cat === 'warmup' || cat === 'sport') && <WarmupSportFields props={props} u={u} />}
    </View>
  );
}

export function DescriptionSection({ instructions, onChange, onFocus, t }: DescProps) {
  return (
    <View style={styles.fieldSection}>
      <Text style={styles.label}>{t('coach.library.fields.descriptionLabel')}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={t('coach.library.fields.descriptionPlaceholder')}
        multiline
        numberOfLines={6}
        value={instructions || ''}
        onChangeText={onChange}
        onFocus={onFocus}
      />
    </View>
  );
}

export function BiomechanicsSection({
  movementPatternId,
  anatomicalPlaneId,
  mappedCatalogs,
  onChange,
  onFocus,
  t,
}: BioProps) {
  const u = t('coach.library.fields.unspecified');
  return (
    <View style={styles.biomechBlock}>
      <Text style={styles.sectionTitle}>{t('coach.library.sections.biomechanics')}</Text>
      <View style={styles.row}>
        <View style={[styles.fieldSection, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>{t('coach.library.fields.movementPatternLabel')}</Text>
          <FormSelect
            options={mappedCatalogs.movementPatterns || []}
            value={movementPatternId}
            onSelect={(v) => onChange('movementPatternId', v)}
            placeholder={u}
            onFocus={onFocus}
          />
        </View>
        <View style={[styles.fieldSection, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>{t('coach.library.fields.anatomicalPlaneLabel')}</Text>
          <FormSelect
            options={mappedCatalogs.anatomicalPlanes || []}
            value={anatomicalPlaneId}
            onSelect={(v) => onChange('anatomicalPlaneId', v)}
            placeholder={u}
            onFocus={onFocus}
          />
        </View>
      </View>
    </View>
  );
}

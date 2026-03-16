import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { FormSelect } from './components/UnifiedExerciseFormSelect';
import { MuscleMultiSelect } from './components/MuscleMultiSelect';
import { styles } from './UnifiedExerciseModal.styles';
import { EquipmentProps, CatFieldsProps, DescProps, BioProps } from './UnifiedExerciseModal.components';

export function EquipmentSection({ equipmentId, options, onChange, onFocus, t, style }: EquipmentProps) {
  return (
    <View style={[styles.cardContainer, style]}>
      <View style={styles.fieldSection}>
        <Text style={styles.label}>{t('coach.library.fields.equipmentLabel')}</Text>
        <FormSelect
          options={options}
          value={equipmentId}
          onSelect={onChange}
          onFocus={onFocus}
        />
      </View>
    </View>
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

function CardioPlioFields({ props }: { props: CatFieldsProps }) {
  const { formState, mappedCatalogs, handleChange, onFocus, t } = props;
  if (formState.category === 'cardio') {
    return (
      <>
        <Text style={styles.label}>{t('coach.library.fields.cardioTypeLabel')}</Text>
        <FormSelect
          options={mappedCatalogs.cardioTypes || []}
          value={formState.cardioTypeId}
          onSelect={(v) => handleChange('cardioTypeId', v)}
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
        onFocus={onFocus}
      />
    </>
  );
}

function WarmupSportFields({ props }: { props: CatFieldsProps }) {
  const { formState, mappedCatalogs, handleChange, onFocus, t } = props;
  if (formState.category === 'warmup') {
    return (
      <>
        <Text style={styles.label}>{t('coach.library.fields.mobilityTypeLabel')}</Text>
        <FormSelect
          options={mappedCatalogs.mobilityTypes || []}
          value={formState.mobilityTypeId}
          onSelect={(v) => handleChange('mobilityTypeId', v)}
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
        onFocus={onFocus}
      />
    </>
  );
}

function IsometricFields({ props }: { props: CatFieldsProps }) {
  const { formState, mappedCatalogs, handleChange, onFocus, t } = props;
  return (
    <>
      <Text style={styles.label}>{t('coach.library.fields.isometricTypeLabel')}</Text>
      <FormSelect
        options={mappedCatalogs.isometricTypes || []}
        value={formState.isometricTypeId}
        onSelect={(v) => handleChange('isometricTypeId', v)}
        onFocus={onFocus}
      />
    </>
  );
}

export function CategorySpecificFields(props: CatFieldsProps) {
  const cat = props.formState.category;
  return (
    <View style={{ zIndex: 90 }}>
      {cat === 'strength' && <StrengthFields props={props} />}
      {(cat === 'cardio' || cat === 'plio') && <CardioPlioFields props={props} />}
      {(cat === 'warmup' || cat === 'sport') && <WarmupSportFields props={props} />}
      {cat === 'isometric' && <IsometricFields props={props} />}
    </View>
  );
}

export function DescriptionSection({ instructions, coachInstructions, onChange, onFocus, t, style }: DescProps) {
  return (
    <View style={[styles.cardContainer, style]}>
      <View style={styles.row}>
        <View style={[{ flex: 1, marginRight: 12 }]}>
          <Text style={styles.label}>{t('coach.library.fields.descriptionLabel')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('coach.library.fields.descriptionPlaceholder')}
            multiline
            numberOfLines={6}
            value={instructions || ''}
            onChangeText={(v) => onChange('instructions', v)}
            onFocus={onFocus}
          />
        </View>
        <View style={[{ flex: 1, marginLeft: 12 }]}>
          <Text style={styles.label}>{t('coach.library.fields.coachInstructionsLabel')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('coach.library.fields.coachInstructionsPlaceholder')}
            multiline
            numberOfLines={6}
            value={coachInstructions || ''}
            onChangeText={(v) => onChange('coachInstructions', v)}
            onFocus={onFocus}
          />
        </View>
      </View>
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
  style
}: BioProps) {
  return (
    <View style={[styles.cardContainer, styles.biomechBlock, style]}>
      <View style={styles.row}>
        <View style={[{ flex: 1, marginRight: 12 }]}>
          <Text style={styles.label}>{t('coach.library.fields.movementPatternLabel')}</Text>
          <FormSelect
            options={mappedCatalogs.movementPatterns || []}
            value={movementPatternId}
            onSelect={(v) => onChange('movementPatternId', v)}
            onFocus={onFocus}
          />
        </View>
        <View style={[{ flex: 1, marginLeft: 12 }]}>
          <Text style={styles.label}>{t('coach.library.fields.anatomicalPlaneLabel')}</Text>
          <FormSelect
            options={mappedCatalogs.anatomicalPlanes || []}
            value={anatomicalPlaneId}
            onSelect={(v) => onChange('anatomicalPlaneId', v)}
            onFocus={onFocus}
          />
        </View>
      </View>
    </View>
  );
}

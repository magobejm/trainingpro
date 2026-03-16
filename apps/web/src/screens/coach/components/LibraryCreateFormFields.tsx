import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type Translator = (key: string) => string;
type StringSetter = (field: string) => (value: string) => void;

type Option = { id: string; label: string };

type FieldConfig = {
  field: string;
  keyboardType?: TextInputProps['keyboardType'];
  multiline?: boolean;
  numberOfLines?: number;
  placeholderKey?: string;
  type?: 'select' | 'text';
};

const EXERCISE_FIELDS: FieldConfig[] = [
  { field: 'name', placeholderKey: 'coach.library.exercises.namePlaceholder' },
  { field: 'muscleGroupId', type: 'select' },
  { field: 'equipment', placeholderKey: 'coach.library.exercises.equipmentPlaceholder' },
  {
    field: 'instructions',
    multiline: true,
    numberOfLines: 3,
    placeholderKey: 'coach.library.exercises.instructionsPlaceholder',
  },
];

const CARDIO_FIELDS: FieldConfig[] = [
  { field: 'name', placeholderKey: 'coach.library.cardio.namePlaceholder' },
  { field: 'methodTypeId', type: 'select' },
  { field: 'equipment', placeholderKey: 'coach.library.exercises.equipmentPlaceholder' },
  {
    field: 'description',
    multiline: true,
    numberOfLines: 3,
    placeholderKey: 'coach.library.cardio.descriptionPlaceholder',
  },
];

const FOOD_FIELDS: FieldConfig[] = [
  { field: 'name', placeholderKey: 'coach.library.foods.namePlaceholder' },
  { field: 'foodType', placeholderKey: 'coach.library.foods.foodTypePlaceholder' },
  { field: 'foodCategory', placeholderKey: 'coach.library.foods.foodCategoryPlaceholder' },
  {
    field: 'caloriesKcal',
    keyboardType: 'numeric',
    placeholderKey: 'coach.library.foods.caloriesPlaceholder',
  },
  {
    field: 'proteinG',
    keyboardType: 'numeric',
    placeholderKey: 'coach.library.foods.proteinPlaceholder',
  },
  {
    field: 'carbsG',
    keyboardType: 'numeric',
    placeholderKey: 'coach.library.foods.carbsPlaceholder',
  },
  {
    field: 'fatG',
    keyboardType: 'numeric',
    placeholderKey: 'coach.library.foods.fatPlaceholder',
  },
  {
    field: 'notes',
    multiline: true,
    numberOfLines: 2,
    placeholderKey: 'coach.library.foods.notesPlaceholder',
  },
  { field: 'mediaUrl', placeholderKey: 'coach.library.foods.mediaUrlPlaceholder' },
  { field: 'mediaType', placeholderKey: 'coach.library.foods.mediaTypePlaceholder' },
];

const ISOMETRIC_FIELDS: FieldConfig[] = [
  { field: 'name', placeholderKey: 'coach.library.exercises.namePlaceholder' },
  { field: 'isometricType', type: 'select' },
  { field: 'equipment', placeholderKey: 'coach.library.exercises.equipmentPlaceholder' },
  {
    field: 'description',
    multiline: true,
    numberOfLines: 2,
    placeholderKey: 'coach.library.exercises.instructionsPlaceholder',
  },
];

const PLIO_FIELDS: FieldConfig[] = [
  { field: 'name', placeholderKey: 'coach.library.exercises.namePlaceholder' },
  { field: 'plioType', type: 'select' },
  { field: 'equipment', placeholderKey: 'coach.library.exercises.equipmentPlaceholder' },
  {
    field: 'description',
    multiline: true,
    numberOfLines: 2,
    placeholderKey: 'coach.library.exercises.instructionsPlaceholder',
  },
];

const SPORT_FIELDS: FieldConfig[] = [
  { field: 'name', placeholderKey: 'coach.library.exercises.namePlaceholder' },
  {
    field: 'description',
    multiline: true,
    numberOfLines: 2,
    placeholderKey: 'coach.library.exercises.instructionsPlaceholder',
  },
];

type BaseProps = {
  form: Record<string, string>;
  setField: StringSetter;
  t: Translator;
};

type CatalogProps = {
  isometricTypeOptions?: Option[];
  mobilityTypeOptions?: Option[];
  methodTypeOptions?: Option[];
  muscleGroupOptions?: Option[];
  plioTypeOptions?: Option[];
};

type FieldsProps = BaseProps & {
  fields: FieldConfig[];
  options: CatalogProps;
};

export function ExerciseBaseFields(props: BaseProps & CatalogProps): React.JSX.Element {
  return <FormFields {...props} fields={EXERCISE_FIELDS} options={props} />;
}

export function CardioBaseFields(props: BaseProps & CatalogProps): React.JSX.Element {
  return <FormFields {...props} fields={CARDIO_FIELDS} options={props} />;
}

export function FoodCreateFields(props: BaseProps): React.JSX.Element {
  return <FormFields {...props} fields={FOOD_FIELDS} options={{}} />;
}

export function IsometricBaseFields(
  props: BaseProps & Pick<CatalogProps, 'isometricTypeOptions'>,
): React.JSX.Element {
  return <FormFields {...props} fields={ISOMETRIC_FIELDS} options={props} />;
}

export function PlioBaseFields(
  props: BaseProps & Pick<CatalogProps, 'plioTypeOptions'>,
): React.JSX.Element {
  return <FormFields {...props} fields={PLIO_FIELDS} options={props} />;
}

const MOBILITY_TYPE_FIELDS: FieldConfig[] = [
  { field: 'name', placeholderKey: 'coach.library.exercises.namePlaceholder' },
  { field: 'mobilityType', type: 'select' },
  {
    field: 'description',
    multiline: true,
    numberOfLines: 2,
    placeholderKey: 'coach.library.exercises.instructionsPlaceholder',
  },
];

export function MobilityBaseFields(
  props: BaseProps & Pick<CatalogProps, 'mobilityTypeOptions'>,
): React.JSX.Element {
  return <FormFields {...props} fields={MOBILITY_TYPE_FIELDS} options={props} />;
}

export function SportBaseFields(props: BaseProps): React.JSX.Element {
  return <FormFields {...props} fields={SPORT_FIELDS} options={{}} />;
}

function FormFields(props: FieldsProps): React.JSX.Element {
  return (
    <>
      {props.fields.map((field) =>
        field.type === 'select' ? renderSelectField(field, props) : renderInputField(field, props),
      )}
    </>
  );
}

function renderInputField(field: FieldConfig, props: FieldsProps): React.JSX.Element {
  return (
    <TextInput
      key={field.field}
      keyboardType={field.keyboardType}
      multiline={field.multiline}
      numberOfLines={field.numberOfLines}
      onChangeText={props.setField(field.field)}
      placeholder={field.placeholderKey ? props.t(field.placeholderKey) : ''}
      style={[styles.input, field.multiline ? styles.inputMultiline : null]}
      value={props.form[field.field] ?? ''}
    />
  );
}

function renderSelectField(field: FieldConfig, props: FieldsProps): React.JSX.Element {
  const options = readOptions(field.field, props.options, props.t);
  return (
    <View key={field.field} style={styles.selectWrap}>
      <Text style={styles.selectLabel}>{readSelectLabel(field.field, props.t)}</Text>
      <select
        onChange={(event) => props.setField(field.field)(event.target.value)}
        style={selectStyle}
        value={props.form[field.field] ?? ''}
      >
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </View>
  );
}

function readOptions(field: string, options: CatalogProps, t: Translator): Option[] {
  if (field === 'muscleGroupId') {
    return options.muscleGroupOptions ?? [];
  }
  if (field === 'methodTypeId') {
    return options.methodTypeOptions ?? [];
  }
  if (field === 'isometricType') {
    return (
      options.isometricTypeOptions ?? [{ id: 'undefined', label: t('coach.library.type.undefined') }]
    );
  }
  if (field === 'mobilityType') {
    return (
      options.mobilityTypeOptions ?? [{ id: 'undefined', label: t('coach.library.type.undefined') }]
    );
  }
  if (field === 'plioType') {
    return (
      options.plioTypeOptions ?? [{ id: 'undefined', label: t('coach.library.type.undefined') }]
    );
  }
  return [];
}

function readSelectLabel(field: string, t: Translator): string {
  if (field === 'muscleGroupId') {
    return t('coach.library.exercises.detail.muscleGroup');
  }
  if (field === 'methodTypeId') {
    return t('coach.library.cardio.detail.methodType');
  }
  if (field === 'isometricType') {
    return t('coach.library.isometric.detail.type');
  }
  if (field === 'mobilityType') {
    return t('coach.library.mobility.detail.type');
  }
  if (field === 'plioType') {
    return t('coach.library.plio.detail.type');
  }
  return '';
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#f3f7fd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  selectLabel: {
    color: '#334e70',
    fontSize: 12,
    fontWeight: '700',
  },
  selectWrap: {
    gap: 6,
  },
});

const selectStyle: React.CSSProperties = {
  border: '1px solid #c8d5ea',
  borderRadius: 10,
  fontSize: 14,
  minHeight: 40,
  outline: 'none',
  padding: 10,
  width: '100%',
};

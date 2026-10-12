import React from 'react';
import { Field, Select, TextField } from '@trainerpro/ui';
import type { ClientForm } from '../client-profile.form';
import { selectStyle, styles } from './EditClientProfileModal.styles';

const FIELD_FIRST_NAME: keyof ClientForm = 'firstName';
const FIELD_LAST_NAME: keyof ClientForm = 'lastName';
const FIELD_EMAIL: keyof ClientForm = 'email';
const FIELD_OBJECTIVE_ID: keyof ClientForm = 'objectiveId';
const FIELD_BIRTH_DATE: keyof ClientForm = 'birthDate';
const FIELD_PHONE: keyof ClientForm = 'phone';
const FIELD_SEX: keyof ClientForm = 'sex';
const FIELD_WEIGHT_KG: keyof ClientForm = 'weightKg';
const FIELD_HEIGHT_CM: keyof ClientForm = 'heightCm';
const FIELD_WAIST_CM: keyof ClientForm = 'waistCm';
const FIELD_HIP_CM: keyof ClientForm = 'hipCm';
const FIELD_FC_MAX: keyof ClientForm = 'fcMax';
const FIELD_FC_REST: keyof ClientForm = 'fcRest';
const FIELD_FITNESS_LEVEL: keyof ClientForm = 'fitnessLevel';
const FIELD_INJURIES: keyof ClientForm = 'injuries';
const FIELD_ALLERGIES: keyof ClientForm = 'allergies';
const FIELD_CONSIDERATIONS: keyof ClientForm = 'considerations';
const FIELD_SECONDARY_OBJECTIVES: keyof ClientForm = 'secondaryObjectives';
const KEYBOARD_EMAIL = 'email-address' as const;
const KEYBOARD_PHONE = 'phone-pad' as const;
const KEYBOARD_NUMERIC = 'numeric' as const;
const INPUT_TYPE_DATE = 'date' as const;
const SEX_UNSPECIFIED = '';
const SEX_MALE = 'male';
const SEX_FEMALE = 'female';
const SEX_OTHER = 'other';
const FITNESS_UNSPECIFIED = '';
const FITNESS_BEGINNER = 'beginner';
const FITNESS_INTERMEDIATE = 'intermediate';
const FITNESS_ADVANCED = 'advanced';
const FITNESS_ELITE = 'elite';

type FieldErrors = Partial<Record<keyof ClientForm, string>>;
type ObjectiveOption = { id: string; label: string };

type Props = {
  errors: FieldErrors;
  form: ClientForm;
  includeAdvancedTextAreas?: boolean;
  includeBirthDateField?: boolean;
  includeBodyMetrics?: boolean;
  includeFitnessField?: boolean;
  includeObjectiveField?: boolean;
  objectiveOptions: ObjectiveOption[];
  onChange: (key: keyof ClientForm, value: string) => void;
  t: (key: string, params?: Record<string, number | string>) => string;
};

export function ProfileFieldsSection(props: Props): React.JSX.Element {
  return (
    <>
      <BaseFields props={props} />
      <BodyMetricFields props={props} />
      <FooterFields props={props} />
    </>
  );
}

function BaseFields({ props }: { props: Props }): React.JSX.Element {
  return (
    <>
      <Input field={FIELD_FIRST_NAME} {...props} />
      <Input field={FIELD_LAST_NAME} {...props} />
      <Input field={FIELD_EMAIL} {...props} keyboardType={KEYBOARD_EMAIL} />
      {props.includeObjectiveField !== false ? <ObjectiveField {...props} /> : null}
      {props.includeBirthDateField !== false ? <DateField {...props} /> : null}
      <Input
        field={FIELD_PHONE}
        {...props}
        keyboardType={KEYBOARD_PHONE}
        placeholder={props.t('coach.clientProfile.fields.phone.placeholder')}
      />
    </>
  );
}

function BodyMetricFields({ props }: { props: Props }): React.JSX.Element {
  if (props.includeBodyMetrics === false) return <></>;
  return (
    <>
      <Input field={FIELD_HEIGHT_CM} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <Input field={FIELD_WEIGHT_KG} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <Input field={FIELD_WAIST_CM} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <Input field={FIELD_HIP_CM} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <Input field={FIELD_FC_MAX} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <Input field={FIELD_FC_REST} {...props} keyboardType={KEYBOARD_NUMERIC} />
    </>
  );
}

function FooterFields({ props }: { props: Props }): React.JSX.Element {
  return (
    <>
      <SexField {...props} />
      {props.includeFitnessField !== false ? <FitnessField {...props} /> : null}
      {props.includeAdvancedTextAreas !== false ? <AdvancedTextAreas props={props} /> : null}
    </>
  );
}

function AdvancedTextAreas({ props }: { props: Props }): React.JSX.Element {
  return (
    <>
      <TextArea field={FIELD_SECONDARY_OBJECTIVES} {...props} />
      <TextArea field={FIELD_INJURIES} {...props} />
      <TextArea field={FIELD_ALLERGIES} {...props} />
      <TextArea field={FIELD_CONSIDERATIONS} {...props} />
    </>
  );
}

function ObjectiveField(props: Props): React.JSX.Element {
  return (
    <Select
      containerStyle={styles.field}
      error={props.errors[FIELD_OBJECTIVE_ID]}
      label={props.t('coach.clientProfile.fields.objective')}
      onChange={(value) => props.onChange(FIELD_OBJECTIVE_ID, value)}
      options={props.objectiveOptions.map((item) => ({ label: item.label, value: item.id }))}
      value={props.form.objectiveId}
    />
  );
}

function Input(
  props: Props & {
    field: keyof ClientForm;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    placeholder?: string;
  },
): React.JSX.Element {
  const key = `coach.clientProfile.fields.${props.field}`;
  return (
    <TextField
      autoCapitalize={props.field === FIELD_EMAIL ? 'none' : 'sentences'}
      containerStyle={styles.field}
      disabled={props.field === FIELD_EMAIL}
      error={props.errors[props.field]}
      keyboardType={props.keyboardType ?? 'default'}
      label={props.t(key)}
      onChangeText={(value) => props.onChange(props.field, value)}
      placeholder={props.placeholder}
      value={props.form[props.field]}
    />
  );
}

function DateField(props: Props): React.JSX.Element {
  return (
    <Field
      error={props.errors[FIELD_BIRTH_DATE]}
      label={props.t('coach.clientProfile.fields.birthDate')}
      style={styles.field}
    >
      <input
        aria-label={props.t('coach.clientProfile.fields.birthDate')}
        onChange={(event) => props.onChange(FIELD_BIRTH_DATE, event.target.value)}
        style={selectStyle}
        type={INPUT_TYPE_DATE}
        value={props.form.birthDate}
      />
    </Field>
  );
}

function SexField(props: Props): React.JSX.Element {
  const options = [
    { label: props.t('coach.clientProfile.sex.unspecified'), value: SEX_UNSPECIFIED },
    { label: props.t('coach.clientProfile.sex.male'), value: SEX_MALE },
    { label: props.t('coach.clientProfile.sex.female'), value: SEX_FEMALE },
    { label: props.t('coach.clientProfile.sex.other'), value: SEX_OTHER },
  ];
  return (
    <Select
      containerStyle={styles.field}
      error={props.errors[FIELD_SEX]}
      label={props.t('coach.clientProfile.fields.sex')}
      onChange={(value) => props.onChange(FIELD_SEX, value)}
      options={options}
      value={props.form.sex}
    />
  );
}

function FitnessField(props: Props): React.JSX.Element {
  const options = [
    { label: props.t('coach.clientProfile.fitness.unspecified'), value: FITNESS_UNSPECIFIED },
    { label: props.t('coach.clientProfile.fitness.beginner'), value: FITNESS_BEGINNER },
    { label: props.t('coach.clientProfile.fitness.intermediate'), value: FITNESS_INTERMEDIATE },
    { label: props.t('coach.clientProfile.fitness.advanced'), value: FITNESS_ADVANCED },
    { label: props.t('coach.clientProfile.fitness.elite'), value: FITNESS_ELITE },
  ];
  return (
    <Select
      containerStyle={styles.field}
      error={props.errors[FIELD_FITNESS_LEVEL]}
      label={props.t('coach.clientProfile.fields.fitnessLevel')}
      onChange={(value) => props.onChange(FIELD_FITNESS_LEVEL, value)}
      options={options}
      value={props.form.fitnessLevel}
    />
  );
}

function TextArea(
  props: Props & {
    field: keyof ClientForm;
  },
): React.JSX.Element {
  const key = `coach.clientProfile.fields.${props.field}`;
  return (
    <TextField
      containerStyle={styles.field}
      error={props.errors[props.field]}
      label={props.t(key)}
      multiline
      numberOfLines={3}
      onChangeText={(value) => props.onChange(props.field, value)}
      value={props.form[props.field]}
    />
  );
}

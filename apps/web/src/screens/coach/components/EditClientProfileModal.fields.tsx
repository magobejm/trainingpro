import React from 'react';
import { Text, TextInput, View } from 'react-native';
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
  objectiveOptions: ObjectiveOption[];
  onChange: (key: keyof ClientForm, value: string) => void;
  t: (key: string, params?: Record<string, number | string>) => string;
};

export function ProfileFieldsSection(props: Props): React.JSX.Element {
  return (
    <>
      <Input field={FIELD_FIRST_NAME} {...props} />
      <Input field={FIELD_LAST_NAME} {...props} />
      <Input field={FIELD_EMAIL} {...props} keyboardType={KEYBOARD_EMAIL} />
      <ObjectiveField {...props} />
      <DateField {...props} />
      <Input
        field={FIELD_PHONE}
        {...props}
        keyboardType={KEYBOARD_PHONE}
        placeholder={props.t('coach.clientProfile.fields.phone.placeholder')}
      />
      <Input field={FIELD_HEIGHT_CM} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <Input field={FIELD_WEIGHT_KG} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <Input field={FIELD_WAIST_CM} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <Input field={FIELD_HIP_CM} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <Input field={FIELD_FC_MAX} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <Input field={FIELD_FC_REST} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <SexField {...props} />
      <FitnessField {...props} />
      <TextArea field={FIELD_SECONDARY_OBJECTIVES} {...props} />
      <TextArea field={FIELD_INJURIES} {...props} />
      <TextArea field={FIELD_ALLERGIES} {...props} />
    </>
  );
}

function ObjectiveField(props: Props): React.JSX.Element {
  const error = props.errors[FIELD_OBJECTIVE_ID];
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t('coach.clientProfile.fields.objective')}</Text>
      <select
        onChange={(event) => props.onChange(FIELD_OBJECTIVE_ID, event.target.value)}
        style={selectStyle}
        value={props.form.objectiveId}
      >
        {props.objectiveOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
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
  const error = props.errors[props.field];
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t(key)}</Text>
      <TextInput
        autoCapitalize={props.field === FIELD_EMAIL ? 'none' : 'sentences'}
        editable={props.field !== FIELD_EMAIL}
        keyboardType={props.keyboardType ?? 'default'}
        onChangeText={(value) => props.onChange(props.field, value)}
        placeholder={props.placeholder}
        style={[
          styles.input,
          props.field === FIELD_EMAIL ? styles.inputReadonly : null,
          error ? styles.inputError : null,
        ]}
        value={props.form[props.field]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function DateField(props: Props): React.JSX.Element {
  const error = props.errors[FIELD_BIRTH_DATE];
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t('coach.clientProfile.fields.birthDate')}</Text>
      <input
        onChange={(event) => props.onChange(FIELD_BIRTH_DATE, event.target.value)}
        style={selectStyle}
        type={INPUT_TYPE_DATE}
        value={props.form.birthDate}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function SexField(props: Props): React.JSX.Element {
  const error = props.errors[FIELD_SEX];
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t('coach.clientProfile.fields.sex')}</Text>
      <select
        onChange={(event) => props.onChange(FIELD_SEX, event.target.value)}
        style={selectStyle}
        value={props.form.sex}
      >
        <option value={SEX_UNSPECIFIED}>{props.t('coach.clientProfile.sex.unspecified')}</option>
        <option value={SEX_MALE}>{props.t('coach.clientProfile.sex.male')}</option>
        <option value={SEX_FEMALE}>{props.t('coach.clientProfile.sex.female')}</option>
        <option value={SEX_OTHER}>{props.t('coach.clientProfile.sex.other')}</option>
      </select>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function FitnessField(props: Props): React.JSX.Element {
  const error = props.errors[FIELD_FITNESS_LEVEL];
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t('coach.clientProfile.fields.fitnessLevel')}</Text>
      <select
        onChange={(event) => props.onChange(FIELD_FITNESS_LEVEL, event.target.value)}
        style={selectStyle}
        value={props.form.fitnessLevel}
      >
        <option value={FITNESS_UNSPECIFIED}>
          {props.t('coach.clientProfile.fitness.unspecified')}
        </option>
        <option value={FITNESS_BEGINNER}>{props.t('coach.clientProfile.fitness.beginner')}</option>
        <option value={FITNESS_INTERMEDIATE}>
          {props.t('coach.clientProfile.fitness.intermediate')}
        </option>
        <option value={FITNESS_ADVANCED}>{props.t('coach.clientProfile.fitness.advanced')}</option>
        <option value={FITNESS_ELITE}>{props.t('coach.clientProfile.fitness.elite')}</option>
      </select>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function TextArea(
  props: Props & {
    field: keyof ClientForm;
  },
): React.JSX.Element {
  const key = `coach.clientProfile.fields.${props.field}`;
  const error = props.errors[props.field];
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t(key)}</Text>
      <TextInput
        multiline
        numberOfLines={3}
        onChangeText={(value) => props.onChange(props.field, value)}
        style={[styles.input, styles.textArea, error ? styles.inputError : null]}
        value={props.form[props.field]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

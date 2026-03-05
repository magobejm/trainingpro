import type { ClientForm } from './client-profile.form';

export type FormErrors = Partial<Record<keyof ClientForm, string>>;

const FIELD_FIRST_NAME: keyof ClientForm = 'firstName';
const FIELD_LAST_NAME: keyof ClientForm = 'lastName';
const FIELD_EMAIL: keyof ClientForm = 'email';
const FIELD_HEIGHT_CM: keyof ClientForm = 'heightCm';
const FIELD_WEIGHT_KG: keyof ClientForm = 'weightKg';
const FIELD_WAIST_CM: keyof ClientForm = 'waistCm';
const FIELD_HIP_CM: keyof ClientForm = 'hipCm';
const FIELD_FC_MAX: keyof ClientForm = 'fcMax';
const FIELD_FC_REST: keyof ClientForm = 'fcRest';
const FIELD_BIRTH_DATE: keyof ClientForm = 'birthDate';
const FIELD_PHONE: keyof ClientForm = 'phone';
const FIELD_SEX: keyof ClientForm = 'sex';
const SEX_MALE = 'male';
const SEX_FEMALE = 'female';
const SEX_OTHER = 'other';

export function validateClientProfileForm(
  form: ClientForm,
  t: (key: string, options?: Record<string, unknown>) => string,
): FormErrors {
  const errors: FormErrors = {};
  validateRequired(errors, FIELD_FIRST_NAME, form.firstName, t);
  validateRequired(errors, FIELD_LAST_NAME, form.lastName, t);
  validateRequired(errors, FIELD_EMAIL, form.email, t);
  validateEmail(errors, form.email, t);
  validateDate(errors, form.birthDate, t);
  validateNumber(errors, FIELD_HEIGHT_CM, form.heightCm, 80, 260, t);
  validateNumber(errors, FIELD_WEIGHT_KG, form.weightKg, 20, 400, t);
  validateNumber(errors, FIELD_WAIST_CM, form.waistCm, 40, 220, t);
  validateNumber(errors, FIELD_HIP_CM, form.hipCm, 40, 220, t);
  validateNumber(errors, FIELD_FC_MAX, form.fcMax, 80, 250, t);
  validateNumber(errors, FIELD_FC_REST, form.fcRest, 30, 160, t);
  validatePhone(errors, form.phone, t);
  validateSex(errors, form.sex, t);
  return errors;
}

function validateRequired(
  errors: FormErrors,
  field: keyof ClientForm,
  value: string,
  t: (key: string) => string,
): void {
  if (value.trim().length === 0) {
    errors[field] = t('coach.clientProfile.validation.required');
  }
}

function validateEmail(errors: FormErrors, email: string, t: (key: string) => string): void {
  if (email.trim().length === 0 || errors[FIELD_EMAIL]) {
    return;
  }
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email.trim())) {
    errors[FIELD_EMAIL] = t('coach.clientProfile.validation.email');
  }
}

function validateDate(errors: FormErrors, value: string, t: (key: string) => string): void {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return;
  }
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(trimmed) || Number.isNaN(new Date(trimmed).getTime())) {
    errors[FIELD_BIRTH_DATE] = t('coach.clientProfile.validation.date');
  }
}

function validateNumber(
  errors: FormErrors,
  field: keyof ClientForm,
  value: string,
  min: number,
  max: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): void {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return;
  }
  const numeric = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(numeric)) {
    errors[field] = t('coach.clientProfile.validation.number');
    return;
  }
  if (numeric < min || numeric > max) {
    errors[field] = t('coach.clientProfile.validation.numberRange', { max, min });
  }
}

function validatePhone(errors: FormErrors, phone: string, t: (key: string) => string): void {
  const trimmed = phone.trim();
  if (trimmed.length === 0) {
    return;
  }
  const pattern = /^[0-9+\-\s()]{6,20}$/;
  if (!pattern.test(trimmed)) {
    errors[FIELD_PHONE] = t('coach.clientProfile.validation.phone');
  }
}

function validateSex(errors: FormErrors, value: string, t: (key: string) => string): void {
  const allowed = ['', SEX_MALE, SEX_FEMALE, SEX_OTHER];
  if (!allowed.includes(value)) {
    errors[FIELD_SEX] = t('coach.clientProfile.validation.sex');
  }
}

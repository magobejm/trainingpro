import type { UpdateClientInput } from '../../data/hooks/useClientMutations';
import type { useClientByIdQuery } from '../../data/hooks/useClientsQuery';

export type ClientForm = {
  allergies: string;
  birthDate: string;
  email: string;
  fcMax: string;
  fcRest: string;
  firstName: string;
  fitnessLevel: string;
  heightCm: string;
  hipCm: string;
  injuries: string;
  lastName: string;
  objectiveId: string;
  phone: string;
  secondaryObjectives: string;
  sex: string;
  waistCm: string;
  weightKg: string;
};

export function emptyForm(): ClientForm {
  return {
    allergies: '',
    birthDate: '',
    email: '',
    fcMax: '',
    fcRest: '',
    firstName: '',
    fitnessLevel: '',
    heightCm: '',
    hipCm: '',
    injuries: '',
    lastName: '',
    objectiveId: '',
    phone: '',
    secondaryObjectives: '',
    sex: '',
    waistCm: '',
    weightKg: '',
  };
}

export function toForm(
  client: NonNullable<ReturnType<typeof useClientByIdQuery>['data']>,
): ClientForm {
  const weight = toStringNumber(client.weightKg);
  return {
    allergies: client.allergies ?? '',
    birthDate: client.birthDate ?? '',
    email: client.email,
    fcMax: toStringNumber(client.fcMax),
    fcRest: toStringNumber(client.fcRest),
    firstName: client.firstName,
    fitnessLevel: client.fitnessLevel ?? '',
    heightCm: client.heightCm ? `${client.heightCm}` : '',
    hipCm: client.hipCm ? `${client.hipCm}` : '',
    injuries: client.injuries ?? '',
    lastName: client.lastName,
    objectiveId: client.objectiveId,
    phone: client.phone ?? '',
    secondaryObjectives: (client.secondaryObjectives ?? []).join(', '),
    sex: client.sex ?? '',
    waistCm: client.waistCm ? `${client.waistCm}` : '',
    weightKg: weight,
  };
}

export function toUpdateInput(form: ClientForm): UpdateClientInput {
  return {
    allergies: normalizeNullableString(form.allergies),
    birthDate: normalizeString(form.birthDate),
    email: normalizeString(form.email),
    fcMax: toNumber(form.fcMax),
    fcRest: toNumber(form.fcRest),
    firstName: normalizeString(form.firstName),
    fitnessLevel: normalizeNullableString(form.fitnessLevel),
    heightCm: toNumber(form.heightCm),
    hipCm: toNumber(form.hipCm),
    injuries: normalizeNullableString(form.injuries),
    lastName: normalizeString(form.lastName),
    objectiveId: normalizeNullableString(form.objectiveId),
    phone: normalizeNullableString(form.phone),
    secondaryObjectives: parseSecondaryObjectives(form.secondaryObjectives),
    sex: normalizeNullableString(form.sex),
    waistCm: toNumber(form.waistCm),
    weightKg: toNumber(form.weightKg),
  };
}

function normalizeString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeNullableString(value: string): null | string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNumber(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toStringNumber(value: null | number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '';
  }
  return `${value}`;
}

function parseSecondaryObjectives(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

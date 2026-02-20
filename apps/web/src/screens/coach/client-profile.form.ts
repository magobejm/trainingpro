import type { UpdateClientInput } from '../../data/hooks/useClientMutations';
import type { useClientByIdQuery } from '../../data/hooks/useClientsQuery';

export type ClientForm = {
  birthDate: string;
  email: string;
  firstName: string;
  heightCm: string;
  lastName: string;
  objectiveId: string;
  phone: string;
  sex: string;
  weightKg: string;
};

export function emptyForm(): ClientForm {
  return {
    birthDate: '',
    email: '',
    firstName: '',
    heightCm: '',
    lastName: '',
    objectiveId: '',
    phone: '',
    sex: '',
    weightKg: '',
  };
}

export function toForm(
  client: NonNullable<ReturnType<typeof useClientByIdQuery>['data']>,
): ClientForm {
  const weight = toStringNumber(client.weightKg);
  return {
    birthDate: client.birthDate ?? '',
    email: client.email,
    firstName: client.firstName,
    heightCm: client.heightCm ? `${client.heightCm}` : '',
    lastName: client.lastName,
    objectiveId: client.objectiveId,
    phone: client.phone ?? '',
    sex: client.sex ?? '',
    weightKg: weight,
  };
}

export function toUpdateInput(form: ClientForm): UpdateClientInput {
  return {
    birthDate: normalizeString(form.birthDate),
    email: normalizeString(form.email),
    firstName: normalizeString(form.firstName),
    heightCm: toNumber(form.heightCm),
    lastName: normalizeString(form.lastName),
    objectiveId: normalizeNullableString(form.objectiveId),
    phone: normalizeNullableString(form.phone),
    sex: normalizeNullableString(form.sex),
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

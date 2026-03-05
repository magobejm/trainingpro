import { Prisma } from '@prisma/client';
import type { ClientCreateInput } from '../../domain/client-create.input';
import type { ClientObjective } from '../../domain/client-objective';
import type { ClientUpdateInput } from '../../domain/client-update.input';
import type { Client } from '../../domain/client';

type PrismaClientWithObjective = Prisma.ClientGetPayload<{
  include: {
    objectiveRef: true;
    trainingPlan: { select: { id: true; name: true } };
  };
}>;

type PrismaObjectiveModel = Prisma.ClientObjectiveGetPayload<Record<string, never>>;
type ClientProfileExtras = {
  allergies?: null | string;
  fcMax?: null | number;
  fcRest?: null | number;
  fitnessLevel?: null | string;
  hipCm?: null | number;
  injuries?: null | string;
  secondaryObjectives?: string[];
  waistCm?: null | number;
};

export type ClientDataPayload = Omit<
  ReturnType<typeof normalizeCreateInput>,
  'clientSupabaseUid' | 'objectiveId'
> & {
  objectiveId: string;
};

export function mapClient(row: PrismaClientWithObjective): Client {
  return { ...mapCoreClient(row), ...mapProfileClient(row) };
}

function readProfileExtras(row: PrismaClientWithObjective): ClientProfileExtras {
  return row as PrismaClientWithObjective & ClientProfileExtras;
}

function mapCoreClient(
  row: PrismaClientWithObjective,
): Omit<Client, keyof ReturnType<typeof mapProfileClient>> {
  return {
    avatarUrl: row.avatarUrl,
    birthDate: row.birthDate,
    coachMembershipId: row.coachMembershipId,
    createdAt: row.createdAt,
    email: row.email,
    firstName: row.firstName,
    heightCm: row.heightCm,
    id: row.id,
    lastName: row.lastName,
    notes: row.notes,
    objective: row.objectiveRef?.label ?? '',
    objectiveId: row.objectiveId,
    organizationId: row.organizationId,
    phone: row.phone,
    sex: row.sex,
    updatedAt: row.updatedAt,
    weightKg: mapDecimal(row.weightKg),
    trainingPlanId: row.trainingPlanId,
    trainingPlan: row.trainingPlan
      ? { id: row.trainingPlan.id, name: row.trainingPlan.name }
      : undefined,
  };
}

function mapProfileClient(row: PrismaClientWithObjective) {
  const extras = readProfileExtras(row);
  return {
    allergies: extras.allergies ?? null,
    fcMax: extras.fcMax ?? null,
    fcRest: extras.fcRest ?? null,
    fitnessLevel: extras.fitnessLevel ?? null,
    hipCm: extras.hipCm ?? null,
    injuries: extras.injuries ?? null,
    secondaryObjectives: extras.secondaryObjectives ?? [],
    waistCm: extras.waistCm ?? null,
  };
}

function mapDecimal(value: Prisma.Decimal | number | null): number | null {
  if (value === null) return null;
  return typeof value === 'number' ? value : value.toNumber();
}

export function mapObjective(row: PrismaObjectiveModel): ClientObjective {
  return {
    code: row.code,
    id: row.id,
    isDefault: row.isDefault,
    label: row.label,
    sortOrder: row.sortOrder,
  };
}

export function normalizeCreateInput(input: ClientCreateInput) {
  return {
    allergies: input.allergies ?? null,
    avatarUrl: input.avatarUrl ?? null,
    birthDate: input.birthDate ?? null,
    clientSupabaseUid: input.clientSupabaseUid,
    email: input.email.trim().toLowerCase(),
    fcMax: input.fcMax ?? null,
    fcRest: input.fcRest ?? null,
    firstName: input.firstName.trim(),
    fitnessLevel: input.fitnessLevel ?? null,
    heightCm: input.heightCm ?? null,
    hipCm: input.hipCm ?? null,
    injuries: input.injuries ?? null,
    lastName: input.lastName.trim(),
    notes: input.notes ?? null,
    objectiveId: input.objectiveId ?? null,
    phone: input.phone ?? null,
    secondaryObjectives: normalizeObjectives(input.secondaryObjectives),
    sex: input.sex ?? null,
    waistCm: input.waistCm ?? null,
    weightKg: input.weightKg,
    trainingPlanId: input.trainingPlanId,
  };
}

export function normalizeUpdateInput(input: ClientUpdateInput): Prisma.ClientUpdateInput {
  const payload = {} as Prisma.ClientUpdateInput & Record<string, unknown>;
  assignIfDefined(payload, 'allergies', input.allergies);
  assignIfDefined(payload, 'avatarUrl', input.avatarUrl);
  assignIfDefined(payload, 'birthDate', input.birthDate);
  assignIfDefined(payload, 'fcMax', input.fcMax);
  assignIfDefined(payload, 'fcRest', input.fcRest);
  assignIfDefined(payload, 'fitnessLevel', input.fitnessLevel);
  assignIfDefined(payload, 'heightCm', input.heightCm);
  assignIfDefined(payload, 'hipCm', input.hipCm);
  assignIfDefined(payload, 'injuries', input.injuries);
  assignIfDefined(payload, 'notes', input.notes);
  assignIfDefined(payload, 'phone', input.phone);
  assignIfDefined(payload, 'secondaryObjectives', normalizeObjectives(input.secondaryObjectives));
  assignIfDefined(payload, 'sex', input.sex);
  assignIfDefined(payload, 'waistCm', input.waistCm);
  assignIfDefined(payload, 'weightKg', toDecimal(input.weightKg));
  if (input.email !== undefined) payload.email = input.email.trim().toLowerCase();
  if (input.firstName !== undefined) payload.firstName = input.firstName.trim();
  if (input.lastName !== undefined) payload.lastName = input.lastName.trim();
  if (input.trainingPlanId !== undefined) {
    payload.trainingPlanId = input.trainingPlanId;
  }
  return payload as Prisma.ClientUpdateInput;
}

function normalizeObjectives(input: string[] | undefined): string[] | undefined {
  if (!input) {
    return input;
  }
  return input.map((value) => value.trim()).filter((value) => value.length > 0);
}

function assignIfDefined(
  payload: Prisma.ClientUpdateInput & Record<string, unknown>,
  key: string,
  value: unknown,
) {
  if (value !== undefined) {
    payload[key] = value;
  }
}

function toDecimal(value: null | number | undefined): Prisma.Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Prisma.Decimal(value);
}

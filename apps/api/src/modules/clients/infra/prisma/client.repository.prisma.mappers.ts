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

export type ClientDataPayload = Omit<
  ReturnType<typeof normalizeCreateInput>,
  'clientSupabaseUid' | 'objectiveId'
> & {
  objectiveId: string;
};

export function mapClient(row: PrismaClientWithObjective): Client {
  const trainingPlan = row.trainingPlan
    ? { id: row.trainingPlan.id, name: row.trainingPlan.name }
    : undefined;

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
    trainingPlan,
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
    avatarUrl: input.avatarUrl ?? null,
    birthDate: input.birthDate ?? null,
    clientSupabaseUid: input.clientSupabaseUid,
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    heightCm: input.heightCm ?? null,
    lastName: input.lastName.trim(),
    notes: input.notes ?? null,
    objectiveId: input.objectiveId ?? null,
    phone: input.phone ?? null,
    sex: input.sex ?? null,
    weightKg: input.weightKg,
    trainingPlanId: input.trainingPlanId,
  };
}

export function normalizeUpdateInput(input: ClientUpdateInput): Prisma.ClientUpdateInput {
  const payload: Prisma.ClientUpdateInput = {};
  assignIfDefined(payload, 'avatarUrl', input.avatarUrl);
  assignIfDefined(payload, 'birthDate', input.birthDate);
  assignIfDefined(payload, 'heightCm', input.heightCm);
  assignIfDefined(payload, 'notes', input.notes);
  assignIfDefined(payload, 'phone', input.phone);
  assignIfDefined(payload, 'sex', input.sex);
  assignIfDefined(payload, 'weightKg', toDecimal(input.weightKg));
  if (input.email !== undefined) payload.email = input.email.trim().toLowerCase();
  if (input.firstName !== undefined) payload.firstName = input.firstName.trim();
  if (input.lastName !== undefined) payload.lastName = input.lastName.trim();

  const extra = payload as Prisma.ClientUpdateInput & { trainingPlanId?: string | null };
  if (input.trainingPlanId !== undefined) {
    extra.trainingPlanId = input.trainingPlanId;
  }
  return payload;
}

function assignIfDefined<
  K extends keyof Prisma.ClientUpdateInput,
  V extends Prisma.ClientUpdateInput[K],
>(payload: Prisma.ClientUpdateInput, key: K, value: V | undefined) {
  if (value !== undefined) {
    payload[key] = value;
  }
}

function toDecimal(value: null | number | undefined): Prisma.Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Prisma.Decimal(value);
}

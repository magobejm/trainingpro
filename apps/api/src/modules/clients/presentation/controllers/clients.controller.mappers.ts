import type { FileStoragePort } from '../../../files/domain/file-storage.port';
import type { Client } from '../../domain/client';
import type { ClientManagementSection } from '../../domain/client-management-section';
import type { ClientProgressPhoto } from '../../domain/client-progress-photo';
import type { CreateClientDto } from '../dto/create-client.dto';
import type { UpdateClientDto } from '../dto/update-client.dto';

export function mapUpdateDto(body: UpdateClientDto) {
  return {
    ...body,
    birthDate:
      body.birthDate === undefined ? undefined : body.birthDate ? new Date(body.birthDate) : null,
  };
}

export function mapCreateDto(body: CreateClientDto) {
  return {
    ...body,
    birthDate: body.birthDate ? new Date(body.birthDate) : null,
  };
}

export function mapClientOutput(client: Client, storage?: FileStoragePort) {
  return { ...mapClientCoreOutput(client), ...mapClientProfileOutput(client, storage) };
}

export function mapManagementSection(item: ClientManagementSection) {
  return {
    archived: item.archived,
    code: item.code,
    sortOrder: item.sortOrder,
  };
}

export function mapProgressPhotoOutput(photo: ClientProgressPhoto, storage?: FileStoragePort) {
  const imageValue = photo.imageUrl;
  const resolvedImageUrl = imageValue.startsWith('http')
    ? imageValue
    : storage
      ? storage.getPublicUrl(imageValue)
      : imageValue;
  return {
    archived: photo.archived,
    clientId: photo.clientId,
    createdAt: formatIso(photo.createdAt),
    id: photo.id,
    imagePath: imageValue,
    imageUrl: resolvedImageUrl,
    updatedAt: formatIso(photo.updatedAt),
  };
}

function mapClientCoreOutput(client: Client) {
  return {
    avatarUrl: client.avatarUrl ?? resolveDefaultAvatarUrl(client.id),
    birthDate: formatDate(client.birthDate),
    coachMembershipId: client.coachMembershipId,
    createdAt: formatIso(client.createdAt),
    email: client.email,
    firstName: client.firstName,
    heightCm: client.heightCm,
    id: client.id,
    lastName: client.lastName,
    notes: client.notes,
    objective: client.objective,
    objectiveId: client.objectiveId,
    organizationId: client.organizationId,
    phone: client.phone,
    sex: client.sex,
    updatedAt: formatIso(client.updatedAt),
    weightKg: client.weightKg,
    trainingPlanId: client.trainingPlanId,
    trainingPlan: client.trainingPlan,
  };
}

function mapClientProfileOutput(client: Client, storage?: FileStoragePort) {
  return {
    allergies: client.allergies,
    considerations: client.considerations,
    fcMax: client.fcMax,
    fcRest: client.fcRest,
    fitnessLevel: client.fitnessLevel,
    hipCm: client.hipCm,
    injuries: client.injuries,
    progressPhotos: client.progressPhotos.map((photo) => mapProgressPhotoOutput(photo, storage)),
    secondaryObjectives: client.secondaryObjectives,
    waistCm: client.waistCm,
  };
}

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatIso(date: Date | string): string {
  return (date instanceof Date ? date : new Date(date)).toISOString();
}

function resolveDefaultAvatarUrl(clientId: string): string {
  void clientId;
  return `${resolvePublicAssetBaseUrl()}/assets/avatars/pixar-robot-neutral.svg`;
}

function resolvePublicAssetBaseUrl(): string {
  return process.env.PUBLIC_ASSET_BASE_URL ?? `http://localhost:${process.env.PORT ?? 8080}`;
}

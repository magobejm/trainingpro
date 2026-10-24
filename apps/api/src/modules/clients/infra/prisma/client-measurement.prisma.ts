import type { Prisma } from '@prisma/client';
import { clientMeasureColumns, measurementDraft, type MeasurementDraft } from '../../domain/client-measurement';
import type { ClientUpdateInput } from '../../domain/client-update.input';
import type { ProgressPhotoMeta } from '../../domain/client-progress-photo';

export function progressPhotoCreate(clientId: string, imageUrl: string, meta?: ProgressPhotoMeta) {
  return {
    archived: false,
    clientId,
    imageUrl,
    pose: meta?.pose ?? null,
    uploadedBy: meta?.uploadedBy ?? 'coach',
  };
}

export async function recordCoachMeasurement(
  tx: Prisma.TransactionClient,
  clientId: string,
  input: ClientUpdateInput,
): Promise<void> {
  const draft = measurementDraft(input);
  if (!draft) return;
  await tx.clientMeasurement.create({ data: measurementData(clientId, 'coach', draft) });
}

export function saveClientMeasurement(tx: Prisma.TransactionClient, clientId: string, draft: MeasurementDraft) {
  return tx.clientMeasurement.create({ data: measurementData(clientId, 'client', draft) }).then(async (created) => {
    await tx.client.update({ data: clientMeasureColumns(draft), where: { id: clientId } });
    return created;
  });
}

function measurementData(clientId: string, recordedBy: 'client' | 'coach', draft: MeasurementDraft) {
  return {
    clientId,
    recordedBy,
    ...(draft.heightCm !== undefined ? { heightCm: draft.heightCm } : {}),
    ...(draft.hipCm !== undefined ? { hipCm: draft.hipCm } : {}),
    ...(draft.waistCm !== undefined ? { waistCm: draft.waistCm } : {}),
    ...(draft.weightKg !== undefined ? { weightKg: draft.weightKg } : {}),
  };
}

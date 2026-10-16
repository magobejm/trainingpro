import type { CoachWrite } from '../../data/hooks/useCoachData';
import type { PlanRecord } from './coach-plan-model';

export type TemplatePublication = { id: string; templateVersion: number };
export type TemplateSaveProgress = { clientSaveId: string; attempted: boolean; publication?: TemplatePublication };
export type TemplateSaveStates = { edit: TemplateSaveProgress; copy: TemplateSaveProgress };
export function canResumeTemplatePublication(progress: TemplateSaveProgress | undefined, template?: PlanRecord): boolean {
  return Boolean(
    progress?.publication &&
    progress.publication.id === template?.id &&
    progress.publication.templateVersion === template?.templateVersion,
  );
}
export function coachTemplateSaveUuid(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const value = Math.floor(Math.random() * 16);
      return (char === 'x' ? value : (value & 3) | 8).toString(16);
    })
  );
}
export function prepareCoachTemplateSaves(value: PlanRecord, uuid = coachTemplateSaveUuid): TemplateSaveStates {
  const previous = value.templateSaves as Partial<TemplateSaveStates> | undefined;
  return {
    edit: previous?.edit ?? { clientSaveId: uuid(), attempted: false },
    copy: previous?.copy ?? { clientSaveId: uuid(), attempted: false },
  };
}
function publication(record: PlanRecord): TemplatePublication {
  if (typeof record.id !== 'string' || !Number.isInteger(record.templateVersion) || Number(record.templateVersion) < 1)
    throw new Error('Invalid template publication');
  return { id: record.id, templateVersion: Number(record.templateVersion) };
}
export async function saveCoachTemplate(
  input: {
    kind: 'routines' | 'warmups';
    payload: PlanRecord;
    progress: TemplateSaveProgress;
    originalId?: string;
    originalVersion?: number;
    clientId?: string;
  },
  write: (request: CoachWrite) => Promise<PlanRecord>,
  onProgress: (progress: TemplateSaveProgress) => void | Promise<void>,
): Promise<TemplatePublication> {
  let progress = input.progress;
  const path = '/plans/templates/' + input.kind;
  const id = progress.publication?.id ?? input.originalId;
  const version = progress.publication?.templateVersion ?? input.originalVersion;
  const retryCreate = !id && progress.attempted;
  if (!id) {
    progress = { ...progress, attempted: true };
    await onProgress(progress);
  }
  let saved = publication(
    await write({
      path: path + (id ? '/' + id : ''),
      method: id ? 'PATCH' : 'POST',
      body: { ...input.payload, clientSaveId: progress.clientSaveId, expectedTemplateVersion: id ? version : undefined },
    }),
  );
  progress = { ...progress, attempted: true, publication: saved };
  await onProgress(progress);
  // An idempotent POST retry can return the earlier payload; apply edits made since that attempt.
  if (retryCreate) {
    saved = publication(
      await write({
        path: path + '/' + saved.id,
        method: 'PATCH',
        body: { ...input.payload, clientSaveId: progress.clientSaveId, expectedTemplateVersion: saved.templateVersion },
      }),
    );
    progress = { ...progress, publication: saved };
    await onProgress(progress);
  }
  if (input.clientId)
    await write({ path: '/clients/' + input.clientId, method: 'PATCH', body: { trainingPlanId: saved.id } });
  return saved;
}

import { ApiClientError } from '../data/api-client';
import { readConflictVersion, type SaveTarget } from './unsaved-work';

type Created = { id: string; templateVersion?: number };

type Session = {
  beginSave: () => void;
  endSave: () => void;
  rememberCreated: (created: Created, clientSaveId: string) => void;
  reportConflict: (version: number | null) => void;
  resolveTarget: (editingId: string | null) => SaveTarget;
};

export function templateSaveFields(target: SaveTarget): {
  clientSaveId?: string;
  expectedTemplateVersion?: number;
  templateId?: string;
} {
  if (target.kind === 'create') return { clientSaveId: target.clientSaveId };
  return {
    expectedTemplateVersion: target.expectedTemplateVersion ?? undefined,
    templateId: target.templateId,
  };
}

export async function saveTemplate<T extends Created>(
  session: Session,
  editingId: string | null,
  send: (fields: ReturnType<typeof templateSaveFields>) => Promise<T>,
): Promise<T> {
  const target = session.resolveTarget(editingId);
  const fields = templateSaveFields(target);
  session.beginSave();
  try {
    const saved = await send(fields);
    if (target.kind === 'create') session.rememberCreated(saved, target.clientSaveId);
    return saved;
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 409) {
      session.reportConflict(readConflictVersion(error.status, error.message));
    }
    throw error;
  } finally {
    session.endSave();
  }
}

export type StoredDraft<T> = {
  clientSaveId: string | null;
  expectedTemplateVersion: number | null;
  rememberedTemplateId: string | null;
  value: T;
};

export type SaveTarget =
  | { clientSaveId: string; kind: 'create' }
  | { expectedTemplateVersion: number | null; kind: 'update'; templateId: string };

type SaveState = {
  clientSaveId: string | null;
  createId: () => string;
  editingId: string | null;
  expectedTemplateVersion: number | null;
  rememberedTemplateId: string | null;
};

export function sameWork(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function isWorkDirty(current: unknown, baseline: unknown): boolean {
  return !sameWork(current, baseline);
}

export function shouldOfferRecovery(stored: unknown, baseline: unknown): boolean {
  return stored != null && !sameWork(stored, baseline);
}

export function resolveSaveTarget(state: SaveState): SaveTarget {
  const templateId = state.editingId ?? state.rememberedTemplateId;
  if (templateId) {
    return {
      expectedTemplateVersion: state.expectedTemplateVersion,
      kind: 'update',
      templateId,
    };
  }
  return { clientSaveId: state.clientSaveId ?? state.createId(), kind: 'create' };
}

export function rememberCreatedTemplate(
  created: { id: string; templateVersion?: number },
  clientSaveId: string,
): Pick<StoredDraft<unknown>, 'clientSaveId' | 'expectedTemplateVersion' | 'rememberedTemplateId'> {
  return {
    clientSaveId,
    expectedTemplateVersion: created.templateVersion ?? 1,
    rememberedTemplateId: created.id,
  };
}

export function readStoredDraft<T>(storage: Pick<Storage, 'getItem'>, key: string): StoredDraft<T> | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredDraft<T>;
    if (!parsed || typeof parsed !== 'object' || !('value' in parsed)) return null;
    return {
      clientSaveId: parsed.clientSaveId ?? null,
      expectedTemplateVersion: parsed.expectedTemplateVersion ?? null,
      rememberedTemplateId: parsed.rememberedTemplateId ?? null,
      value: parsed.value,
    };
  } catch {
    return null;
  }
}

export function writeStoredDraft<T>(storage: Pick<Storage, 'setItem'>, key: string, draft: StoredDraft<T>): void {
  storage.setItem(key, JSON.stringify(draft));
}

export function clearStoredDraft(storage: Pick<Storage, 'removeItem'>, key: string): void {
  storage.removeItem(key);
}

export function readConflictVersion(status: number, body: string): number | null {
  if (status !== 409) return null;
  try {
    const parsed = JSON.parse(body) as { templateVersion?: number };
    return typeof parsed.templateVersion === 'number' ? parsed.templateVersion : null;
  } catch {
    return null;
  }
}

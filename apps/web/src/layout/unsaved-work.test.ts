import { describe, expect, it } from 'vitest';
import {
  isWorkDirty,
  readStoredDraft,
  rememberCreatedTemplate,
  resolveSaveTarget,
  shouldOfferRecovery,
  writeStoredDraft,
} from './unsaved-work';

describe('unsaved work', () => {
  it('marks the draft dirty only when it differs from the last saved snapshot', () => {
    expect(isWorkDirty({ name: 'A' }, { name: 'A' })).toBe(false);
    expect(isWorkDirty({ name: 'B' }, { name: 'A' })).toBe(true);
  });

  it('offers recovery when the stored draft differs from the loaded template', () => {
    const storage = memoryStorage();
    writeStoredDraft(storage, 'routine', {
      clientSaveId: null,
      expectedTemplateVersion: 1,
      rememberedTemplateId: null,
      value: { name: 'borrador' },
    });
    const stored = readStoredDraft<{ name: string }>(storage, 'routine');
    expect(shouldOfferRecovery(stored?.value, { name: 'plantilla' })).toBe(true);
    expect(shouldOfferRecovery(stored?.value, { name: 'borrador' })).toBe(false);
  });

  it('uses the id returned by the first save on the next save', () => {
    const first = resolveSaveTarget({
      clientSaveId: null,
      createId: () => 'save-1',
      editingId: null,
      expectedTemplateVersion: null,
      rememberedTemplateId: null,
    });
    expect(first).toEqual({ clientSaveId: 'save-1', kind: 'create' });
    const remembered = rememberCreatedTemplate({ id: 'tpl-9', templateVersion: 1 }, 'save-1');
    const second = resolveSaveTarget({
      clientSaveId: remembered.clientSaveId,
      createId: () => 'save-2',
      editingId: null,
      expectedTemplateVersion: remembered.expectedTemplateVersion,
      rememberedTemplateId: remembered.rememberedTemplateId,
    });
    expect(second).toEqual({ expectedTemplateVersion: 1, kind: 'update', templateId: 'tpl-9' });
  });
});

function memoryStorage(): Pick<Storage, 'getItem' | 'removeItem' | 'setItem'> {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

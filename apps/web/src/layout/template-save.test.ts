import { expect, it, vi } from 'vitest';
import { saveTemplate } from './template-save';
import type { SaveTarget } from './unsaved-work';

it('keeps the version returned by an update for the next save', async () => {
  const target: SaveTarget = { expectedTemplateVersion: 4, kind: 'update', templateId: 'tpl' };
  const rememberVersion = vi.fn();
  const send = vi.fn(async () => ({ id: 'tpl', templateVersion: 5 }));
  await saveTemplate(
    session(rememberVersion, () => target),
    'tpl',
    send,
  );
  expect(send).toHaveBeenCalledWith({ expectedTemplateVersion: 4, templateId: 'tpl' });
  expect(rememberVersion).toHaveBeenCalledWith(5);
});

function session(rememberVersion: (version: number) => void, resolveTarget: () => SaveTarget) {
  return {
    beginSave: vi.fn(),
    endSave: vi.fn(),
    rememberCreated: vi.fn(),
    rememberVersion,
    reportConflict: vi.fn(),
    resolveTarget,
  };
}

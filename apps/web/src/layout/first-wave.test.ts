import { describe, expect, it } from 'vitest';
import { beginDelete, restoreAfterFailure, shouldRunDelete, undoDelete } from './deferred-delete';
import { resolveToastDuration, shouldFireExpire } from '../../../../packages/ui/src/primitives/toast.logic';
import { matchReducedMotion } from '@trainerpro/ui';

describe('deferred delete', () => {
  it('oculta al programar, reaparece al deshacer y no llama a la API', () => {
    const pending = beginDelete(new Set(), 'note-1');
    expect(pending.has('note-1')).toBe(true);
    expect(shouldRunDelete(pending, 'note-1', false)).toBe(true);
    const undone = undoDelete(pending, 'note-1');
    expect(undone.has('note-1')).toBe(false);
    expect(shouldRunDelete(undone, 'note-1', true)).toBe(false);
  });

  it('restaura el elemento si el borrado falla', () => {
    const pending = beginDelete(new Set(['note-1']), 'note-2');
    expect(restoreAfterFailure(pending, 'note-2').has('note-2')).toBe(false);
    expect(restoreAfterFailure(pending, 'note-2').has('note-1')).toBe(true);
  });
});

describe('toast', () => {
  it('respeta la duración pedida y no caduca si se pulsa la acción', () => {
    expect(resolveToastDuration('error', 5000)).toBe(5000);
    expect(resolveToastDuration('error')).toBe(8000);
    expect(shouldFireExpire(true)).toBe(false);
    expect(shouldFireExpire(false)).toBe(true);
  });
});

describe('useReducedMotion', () => {
  it('devuelve false si no existe matchMedia', () => {
    expect(matchReducedMotion(undefined)).toBe(false);
  });
});

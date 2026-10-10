import { describe, expect, it } from 'vitest';
import { nextFocusable, restoreFocus } from './useDialogFocus';

describe('dialog focus', () => {
  it('returns focus to the control that opened the dialog', () => {
    const opener = {
      focused: false,
      focus() {
        this.focused = true;
      },
    };
    restoreFocus(opener);
    expect(opener.focused).toBe(true);
    restoreFocus(null);
  });

  it('wraps the tab order at the edges of the dialog', () => {
    const first = { id: 'first' };
    const last = { id: 'last' };
    expect(nextFocusable([first, last], last, false)).toBe(first);
    expect(nextFocusable([first, last], first, true)).toBe(last);
  });
});

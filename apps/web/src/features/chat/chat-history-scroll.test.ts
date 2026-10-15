import { expect, it } from 'vitest';
import { captureChatAnchor, restoreChatAnchor, newChatMessageIds } from './chat-history-scroll';
const msg = (id: string, createdAt: string) => ({ id, createdAt });
it('does not count prepended history as unread', () => {
  expect(
    newChatMessageIds(
      [msg('2', '2026-10-15T10:00:00Z')],
      [msg('1', '2026-10-14T10:00:00Z'), msg('2', '2026-10-15T10:00:00Z'), msg('3', '2026-10-15T11:00:00Z')],
    ),
  ).toEqual(['3']);
});
it('restores the first visible message after a prepend and simultaneous append', () => {
  let top = 80;
  const child = { id: 'chat-message-2', getBoundingClientRect: () => ({ top, bottom: top + 40 }) };
  const viewport = {
    scrollTop: 30,
    getBoundingClientRect: () => ({ top: 100 }),
    querySelectorAll: () => [child],
  } as unknown as HTMLElement;
  const anchor = captureChatAnchor(viewport);
  top += 500;
  restoreChatAnchor(viewport, anchor);
  expect(viewport.scrollTop).toBe(530);
});

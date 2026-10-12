import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
const captured = vi.hoisted(() => ({ options: {} as Record<string, unknown> }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: Record<string, unknown>) => {
    captured.options = options;
    return {};
  },
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));
vi.mock('../../store/auth.store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ accessToken: 'token', activeRole: 'coach' }),
}));
import { useChatMessagesQuery } from './useChat';
function Probe({ thread }: { thread: string }) {
  useChatMessagesQuery(thread);
  return null;
}
describe('open conversation polling', () => {
  it('refreshes the selected conversation every ten seconds', () => {
    renderToStaticMarkup(React.createElement(Probe, { thread: 'open-thread' }));
    expect(captured.options.refetchInterval).toBe(10000);
    expect(captured.options.enabled).toBe(true);
  });
  it('does not poll when no conversation is open', () => {
    renderToStaticMarkup(React.createElement(Probe, { thread: '' }));
    expect(captured.options.enabled).toBe(false);
    expect(captured.options.refetchInterval).toBe(false);
  });
});

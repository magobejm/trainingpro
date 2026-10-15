import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { QueryClient, type FetchQueryOptions } from '@tanstack/react-query';
import type { ChatHistory, ChatMessage } from '@trainerpro/shared';
const captured = vi.hoisted(() => ({
  query: {} as Record<string, unknown>,
  client: null as unknown,
  result: null as unknown,
  get: vi.fn(),
}));
vi.mock('@tanstack/react-query', async (original) => {
  const actual = await original<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => captured.client,
    useQuery: (options: Record<string, unknown>) => {
      captured.query = options;
      const client = captured.client as QueryClient;
      return { data: client.getQueryData(options.queryKey as string[]) };
    },
    useMutation: (options: { mutationFn: (input: unknown) => Promise<void> }) => ({ mutateAsync: options.mutationFn }),
  };
});
vi.mock('../api-client', () => ({ createApiClient: () => ({ get: captured.get }) }));
vi.mock('../../store/auth.store', () => ({
  useAuthStore: (select: (value: unknown) => unknown) => select({ accessToken: 'token', activeRole: 'coach' }),
}));
import { useChatHistoryQuery } from './useChatHistoryQuery';
const at = (n: number): ChatMessage => ({
  id: String(n).padStart(4, '0'),
  createdAt: new Date(1700000000000 + n).toISOString(),
  expiresAt: '2099-01-01T00:00:00Z',
  threadId: 'thread',
  senderRole: 'COACH',
  senderSubject: 'coach',
  text: String(n),
  attachments: [],
  callProposal: null,
});
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => at(a + i));
function Probe({ thread }: { thread: string }) {
  captured.result = useChatHistoryQuery(thread);
  return null;
}
function probe(thread = 'thread') {
  renderToStaticMarkup(React.createElement(Probe, { thread }));
  return captured.result as ReturnType<typeof useChatHistoryQuery>;
}
const key = (thread = 'thread') => ['chat-messages', 'coach', thread];
const refresh = () =>
  (captured.client as QueryClient).fetchQuery(captured.query as unknown as FetchQueryOptions<ChatHistory>);
beforeEach(() => {
  captured.client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  captured.get.mockReset();
});
it('accumulates history while a pending refresh receives a burst', async () => {
  const client = captured.client as QueryClient;
  client.setQueryDefaults(key(), {});
  probe();
  captured.get.mockResolvedValueOnce(range(51, 100));
  await refresh();
  const vm = probe();
  let release: (page: ChatMessage[]) => void = () => undefined;
  const latest = new Promise<ChatMessage[]>((resolve) => {
    release = resolve;
  });
  captured.get.mockImplementation((path: string) =>
    path.includes('beforeId=0051')
      ? Promise.resolve(range(1, 50))
      : path.includes('beforeId=0101')
        ? Promise.resolve(range(51, 100))
        : latest,
  );
  const polling = refresh();
  await vm.loadOlder();
  release(range(101, 150));
  await polling;
  expect(client.getQueryData<ChatHistory>(key())?.messages).toHaveLength(150);
  expect(client.getQueryData<ChatHistory>(key())?.oldestId).toBe('0001');
});
it('does not publish half a refresh when filling a gap fails', async () => {
  probe();
  captured.get.mockResolvedValueOnce(range(1, 50));
  await refresh();
  probe();
  captured.get.mockResolvedValueOnce(range(101, 150)).mockRejectedValueOnce(new Error('offline'));
  await expect(refresh()).rejects.toThrow('offline');
  expect((captured.client as QueryClient).getQueryData<ChatHistory>(key())?.messages).toHaveLength(50);
});
it('puts an old conversation response in its own cache', async () => {
  probe('old');
  captured.get.mockResolvedValueOnce(range(51, 100));
  await refresh();
  const vm = probe('old');
  let release: (page: ChatMessage[]) => void = () => undefined;
  captured.get.mockImplementationOnce(
    () =>
      new Promise<ChatMessage[]>((resolve) => {
        release = resolve;
      }),
  );
  const oldLoad = vm.loadOlder();
  probe('new');
  release(range(1, 50));
  await oldLoad;
  expect((captured.client as QueryClient).getQueryData<ChatHistory>(key('old'))?.messages).toHaveLength(100);
  expect((captured.client as QueryClient).getQueryData(key('new'))).toBeUndefined();
});

it('uses the raw database page boundary when serialized timestamps tie', async () => {
  probe();
  const page = range(1, 50)
    .reverse()
    .map((message) => ({ ...message, createdAt: at(1).createdAt }));
  captured.get.mockResolvedValueOnce(page);
  await refresh();
  const vm = probe();
  captured.get.mockResolvedValueOnce([]);
  await vm.loadOlder();
  expect(captured.get).toHaveBeenLastCalledWith('/chat/messages?threadId=thread&beforeId=0050');
});
it('allows only one history request at a time', async () => {
  probe();
  captured.get.mockResolvedValueOnce(range(51, 100));
  await refresh();
  const vm = probe();
  let release: (page: ChatMessage[]) => void = () => undefined;
  captured.get.mockImplementationOnce(
    () =>
      new Promise<ChatMessage[]>((resolve) => {
        release = resolve;
      }),
  );
  const first = vm.loadOlder();
  const second = vm.loadOlder();
  release(range(1, 50));
  await Promise.all([first, second]);
  expect(captured.get).toHaveBeenCalledTimes(2);
});

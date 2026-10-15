import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CHAT_HISTORY_PAGE_SIZE,
  emptyChatHistory,
  fetchChatRecent,
  mergeChatHistory,
  type ChatHistory,
  type ChatMessage,
} from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export function useChatHistoryQuery(threadId: string) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const client = useQueryClient();
  const locks = useRef(new Set<string>());
  const queryKey = ['chat-messages', activeRole, threadId] as string[];
  const enabled = Boolean(accessToken && activeRole && threadId);
  const fetchPage = async (beforeId?: string) => {
    if (!accessToken || !activeRole || !threadId) throw new Error('Missing authenticated context');
    const params = new URLSearchParams({ threadId });
    if (beforeId) params.set('beforeId', beforeId);
    return createApiClient({ accessToken, activeRole }).get<ChatMessage[]>('/chat/messages?' + params);
  };
  const query = useQuery<ChatHistory>({
    enabled,
    queryKey,
    queryFn: () => fetchChatRecent(fetchPage, client.getQueryData<ChatHistory>(queryKey)?.messages ?? []),
    structuralSharing: (previous, incoming) =>
      mergeChatHistory(previous as ChatHistory | undefined, incoming as ChatHistory),
    refetchInterval: enabled ? 10_000 : false,
    refetchIntervalInBackground: false,
  });
  const older = useMutation({
    mutationKey: ['chat-history', activeRole, threadId],
    retry: false,
    mutationFn: async (request: { cursor: string; threadId: string; queryKey: string[]; fetchPage: typeof fetchPage }) => {
      const page = await request.fetchPage(request.cursor);
      client.setQueryData<ChatHistory>(request.queryKey, (current) =>
        mergeChatHistory(current, {
          source: 'older',
          initialized: true,
          messages: page,
          hasOlder: page.length === CHAT_HISTORY_PAGE_SIZE,
          oldestId: page[0]?.id ?? current?.oldestId,
        }),
      );
    },
  });
  const state = query.data ?? emptyChatHistory();
  const loadOlder = async () => {
    const cursor = client.getQueryData<ChatHistory>(queryKey)?.oldestId;
    if (!enabled || !cursor || !state.hasOlder || locks.current.has(threadId)) return;
    locks.current.add(threadId);
    try {
      await older.mutateAsync({ cursor, threadId, queryKey, fetchPage });
    } catch {
      /* Inline error remains retryable. */
    } finally {
      locks.current.delete(threadId);
    }
  };
  return {
    ...query,
    data: state.messages,
    hasOlder: state.hasOlder,
    loadOlder,
    isLoadingOlder: older?.variables?.threadId === threadId && older.isPending,
    historyError: older?.variables?.threadId === threadId ? older.error : null,
    isError: query.isError && !state.initialized,
    refreshError: state.initialized ? query.error : null,
  };
}

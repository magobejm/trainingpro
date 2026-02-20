import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

type ChatAttachment = {
  fileName: string;
  id: string;
  kind: 'AUDIO' | 'IMAGE' | 'PDF';
  mimeType: string;
  publicUrl: null | string;
  sizeBytes: number;
  storagePath: string;
};

export type ChatMessage = {
  attachments: ChatAttachment[];
  createdAt: string;
  expiresAt: string;
  id: string;
  senderRole: 'COACH' | 'CLIENT';
  senderSubject: string;
  text: null | string;
  threadId: string;
};

type UploadPolicy = {
  kind: 'AUDIO' | 'IMAGE' | 'PDF';
  maxSizeBytes: number;
  path: string;
};

type SendChatInput = {
  attachments?: Array<{
    fileName: string;
    kind: 'AUDIO' | 'IMAGE' | 'PDF';
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
  }>;
  text?: string;
  threadId: string;
};

export function useClientThreadQuery() {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => createApiClient(auth!).get<{ id: string }>('/chat/thread'),
    queryKey: ['chat-thread', auth?.activeRole],
  });
}

export function useChatMessagesQuery(threadId: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && threadId.length > 0,
    queryFn: () => createApiClient(auth!).get<ChatMessage[]>(`/chat/messages?threadId=${threadId}`),
    queryKey: ['chat-messages', auth?.activeRole, threadId],
  });
}

export function useSendChatMessageMutation(threadId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<SendChatInput, 'threadId'>) => {
      if (!auth) {
        throw new Error('Missing authenticated context');
      }
      return createApiClient(auth).post('/chat/messages', { ...input, threadId });
    },
    onSuccess: () => {
      const queryKey = ['chat-messages', auth?.activeRole, threadId];
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUploadPolicyMutation() {
  const auth = useAuth();
  return useMutation({
    mutationFn: (
      input: { fileName: string; mimeType: string; sizeBytes: number; threadId: string },
    ) => {
      if (!auth) {
        throw new Error('Missing authenticated context');
      }
      return createApiClient(auth).post<UploadPolicy>('/files/upload-policy', input);
    },
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) {
    return null;
  }
  return { accessToken, activeRole };
}

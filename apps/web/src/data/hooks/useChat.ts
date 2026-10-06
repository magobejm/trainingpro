import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { readFrontEnv } from '../env';
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

export function useCoachThreadQuery(clientId: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && clientId.length > 0,
    queryFn: () => createApiClient(auth!).get<{ id: string }>(`/chat/thread?clientId=${clientId}`),
    queryKey: ['chat-thread', auth?.activeRole, clientId],
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
    mutationFn: (input: {
      attachments?: Array<{
        fileName: string;
        kind: 'AUDIO' | 'IMAGE' | 'PDF';
        mimeType: string;
        sizeBytes: number;
        storagePath: string;
      }>;
      text?: string;
    }) => {
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

export async function postChatUpload(
  auth: { accessToken: string; activeRole: 'admin' | 'coach' | 'client' },
  threadId: string,
  form: FormData,
): Promise<{
  fileName: string;
  kind: 'AUDIO' | 'IMAGE' | 'PDF';
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}> {
  const baseUrl = readFrontEnv().EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  const response = await fetch(`${baseUrl}/files/chat-upload`, {
    body: form,
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Active-Role': auth.activeRole,
    },
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Chat upload failed');
  }
  const body: unknown = await response.json();
  if (!isUploadedChatFile(body)) {
    throw new Error('Chat upload failed');
  }
  return body;
}

function isUploadedChatFile(value: unknown): value is {
  fileName: string;
  kind: 'AUDIO' | 'IMAGE' | 'PDF';
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
} {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.fileName === 'string' &&
    (record.kind === 'AUDIO' || record.kind === 'IMAGE' || record.kind === 'PDF') &&
    typeof record.mimeType === 'string' &&
    typeof record.sizeBytes === 'number' &&
    typeof record.storagePath === 'string' &&
    record.storagePath.length > 0
  );
}

export function useUploadPolicyMutation() {
  const auth = useAuth();
  return useMutation({
    mutationFn: (input: { fileName: string; mimeType: string; sizeBytes: number; threadId: string }) => {
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

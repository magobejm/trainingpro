import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import type { NoteData } from '../../screens/coach/notes-screen.types';

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

type CreateNoteInput = {
  type: 'client' | 'general';
  clientId?: string;
  content: string;
};

type UpdateNoteInput = {
  content: string;
};

type ListNotesQuery = {
  type?: 'client' | 'general';
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function useNotesQuery(query: ListNotesQuery = {}) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryKey: ['notes', query],
    queryFn: async () => {
      if (!auth) throw new Error('Not authenticated');
      const api = createApiClient(auth);
      const params = new URLSearchParams();
      if (query.type) params.append('type', query.type);
      if (query.clientId) params.append('clientId', query.clientId);
      if (query.dateFrom) params.append('dateFrom', query.dateFrom);
      if (query.dateTo) params.append('dateTo', query.dateTo);
      const url = `/notes${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<{ data: NoteData[] }>(url);
      return response.data.map((note: NoteData) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
    },
  });
}

export function useCreateNoteMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      if (!auth) throw new Error('Not authenticated');
      const api = createApiClient(auth);
      const response = await api.post<NoteData>('/notes', input);
      return {
        ...response,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUpdateNoteMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useMutation({
    mutationFn: async ({ noteId, input }: { noteId: string; input: UpdateNoteInput }) => {
      if (!auth) throw new Error('Not authenticated');
      const api = createApiClient(auth);
      const response = await api.patch<NoteData>(`/notes/${noteId}`, input);
      return {
        ...response,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteNoteMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!auth) throw new Error('Not authenticated');
      const api = createApiClient(auth);
      await api.delete(`/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

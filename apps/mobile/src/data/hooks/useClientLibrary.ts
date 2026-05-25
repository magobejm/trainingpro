import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient } from '../api-client';

export type ClientLibraryExercise = {
  equipment: null | string;
  id: string;
  instructions: null | string;
  mediaType: null | string;
  mediaUrl: null | string;
  muscleGroups: Array<{ id: string; label: string }>;
  name: string;
  scope: string;
  youtubeUrl: null | string;
};

export type ClientLibraryCardio = {
  description: null | string;
  equipment: null | string;
  id: string;
  mediaType: null | string;
  mediaUrl: null | string;
  methodType: null | string;
  name: string;
  scope: string;
  youtubeUrl: null | string;
};

export type ClientLibraryPlio = {
  description: null | string;
  equipment: null | string;
  id: string;
  mediaType: null | string;
  mediaUrl: null | string;
  name: string;
  notes: null | string;
  plioType: null | string;
  scope: string;
  youtubeUrl: null | string;
};

export type ClientLibraryMobility = {
  description: null | string;
  id: string;
  mediaType: null | string;
  mediaUrl: null | string;
  mobilityType: null | string;
  name: string;
  scope: string;
  youtubeUrl: null | string;
};

export type ClientLibraryIsometric = {
  description: null | string;
  equipment: null | string;
  id: string;
  isometricType: null | string;
  mediaType: null | string;
  mediaUrl: null | string;
  name: string;
  notes: null | string;
  scope: string;
  youtubeUrl: null | string;
};

export type ClientLibrarySport = {
  description: null | string;
  icon: string;
  id: string;
  mediaUrl: null | string;
  name: string;
  scope: string;
};

export type LibraryItem =
  | ClientLibraryCardio
  | ClientLibraryExercise
  | ClientLibraryIsometric
  | ClientLibraryMobility
  | ClientLibraryPlio
  | ClientLibrarySport;

export function useClientLibraryExercisesQuery(q: string, enabled = true) {
  const auth = useAuth();
  return useQuery({
    enabled: enabled && Boolean(auth),
    queryFn: () => fetchLibraryItems<ClientLibraryExercise>(auth, 'exercises', q),
    queryKey: ['clients', 'me', 'library', 'exercises', q],
  });
}

export function useClientLibraryCardioQuery(q: string, enabled = true) {
  const auth = useAuth();
  return useQuery({
    enabled: enabled && Boolean(auth),
    queryFn: () => fetchLibraryItems<ClientLibraryCardio>(auth, 'cardio-methods', q),
    queryKey: ['clients', 'me', 'library', 'cardio', q],
  });
}

export function useClientLibraryPlioQuery(q: string, enabled = true) {
  const auth = useAuth();
  return useQuery({
    enabled: enabled && Boolean(auth),
    queryFn: () => fetchLibraryItems<ClientLibraryPlio>(auth, 'plio-exercises', q),
    queryKey: ['clients', 'me', 'library', 'plio', q],
  });
}

export function useClientLibraryMobilityQuery(q: string, enabled = true) {
  const auth = useAuth();
  return useQuery({
    enabled: enabled && Boolean(auth),
    queryFn: () => fetchLibraryItems<ClientLibraryMobility>(auth, 'mobility-exercises', q),
    queryKey: ['clients', 'me', 'library', 'mobility', q],
  });
}

export function useClientLibraryIsometricQuery(q: string, enabled = true) {
  const auth = useAuth();
  return useQuery({
    enabled: enabled && Boolean(auth),
    queryFn: () => fetchLibraryItems<ClientLibraryIsometric>(auth, 'isometric-exercises', q),
    queryKey: ['clients', 'me', 'library', 'isometric', q],
  });
}

export function useClientLibrarySportsQuery(q: string, enabled = true) {
  const auth = useAuth();
  return useQuery({
    enabled: enabled && Boolean(auth),
    queryFn: () => fetchLibraryItems<ClientLibrarySport>(auth, 'sports', q),
    queryKey: ['clients', 'me', 'library', 'sports', q],
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchLibraryItems<T>(auth: ReturnType<typeof useAuth>, endpoint: string, q: string): Promise<T[]> {
  if (!auth) throw new Error('Missing authenticated context');
  const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  return createApiClient(auth).get<T[]>(`/clients/me/library/${endpoint}${qs}`);
}

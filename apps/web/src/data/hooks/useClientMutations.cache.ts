import type { QueryClient } from '@tanstack/react-query';

type ClientUpdateInput = Record<string, unknown>;

export function syncAvatarInCache(
  queryClient: QueryClient,
  clientId: string,
  avatarUrl: string,
): void {
  updateDetailAvatar(queryClient, clientId, avatarUrl);
  updateListAvatar(queryClient, clientId, avatarUrl);
}

export function syncClientInCache(
  queryClient: QueryClient,
  clientId: string,
  input: ClientUpdateInput,
): void {
  queryClient.setQueriesData({ queryKey: ['clients', 'detail', clientId] }, (previous) => {
    if (!isObject(previous)) {
      return previous;
    }
    return { ...previous, ...input };
  });
}

function updateDetailAvatar(queryClient: QueryClient, clientId: string, avatarUrl: string): void {
  queryClient.setQueriesData({ queryKey: ['clients', 'detail', clientId] }, (previous) => {
    if (!isObject(previous)) {
      return previous;
    }
    return { ...previous, avatarUrl };
  });
}

function updateListAvatar(queryClient: QueryClient, clientId: string, avatarUrl: string): void {
  queryClient.setQueriesData({ queryKey: ['clients', 'list'] }, (previous) => {
    if (!Array.isArray(previous)) {
      return previous;
    }
    return previous.map((item) => updateListItemAvatar(item, clientId, avatarUrl));
  });
}

function updateListItemAvatar(item: unknown, clientId: string, avatarUrl: string): unknown {
  if (!isObject(item) || item.id !== clientId) {
    return item;
  }
  return { ...item, avatarUrl };
}

function isObject(value: unknown): value is { avatarUrl?: string; id?: string } {
  return typeof value === 'object' && value !== null;
}

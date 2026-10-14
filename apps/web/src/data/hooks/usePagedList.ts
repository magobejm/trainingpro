import { useEffect, useState } from 'react';
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export const PAGE_SIZE = 30;
const LOAD_NEXT_DISTANCE = 280;

export type PagedResponse<T> = {
  items: T[];
  nextCursor?: string | null;
};

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);
  return debounced;
}

export function usePagedList<T>(options: {
  enabled?: boolean;
  fetchPage: (cursor: string | null) => Promise<PagedResponse<T>>;
  queryKey: QueryKey;
}) {
  const query = useInfiniteQuery({
    enabled: options.enabled ?? true,
    getNextPageParam: (last: PagedResponse<T>) => last.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => options.fetchPage(pageParam),
    queryKey: options.queryKey,
  });
  return { ...query, items: flattenPages(query.data?.pages) };
}

export function flattenPages<T>(pages: Array<PagedResponse<T>> | undefined): T[] {
  return pages?.flatMap((page) => page.items) ?? [];
}

export function shouldLoadNextPage(metrics: { contentHeight: number; offsetY: number; viewportHeight: number }): boolean {
  return metrics.contentHeight - metrics.viewportHeight - metrics.offsetY < LOAD_NEXT_DISTANCE;
}

export function loadNextPage(
  event: NativeSyntheticEvent<NativeScrollEvent>,
  query: { fetchNextPage: () => unknown; hasNextPage: boolean; isFetchingNextPage: boolean },
): void {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  const nearEnd = shouldLoadNextPage({
    contentHeight: contentSize.height,
    offsetY: contentOffset.y,
    viewportHeight: layoutMeasurement.height,
  });
  if (nearEnd && query.hasNextPage && !query.isFetchingNextPage) {
    void query.fetchNextPage();
  }
}

export function definedParams(entries: Array<[string, string | number | undefined]>): Record<string, string> {
  return Object.fromEntries(
    entries.flatMap(([key, value]) => (value === undefined || value === '' ? [] : [[key, String(value)]])),
  );
}

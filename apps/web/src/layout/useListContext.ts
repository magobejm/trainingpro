import { useEffect, useState } from 'react';
import { readListContext, readRouteClientId, writeListContext, writeRouteClientId } from './list-context';

export function useListContext<T>(
  key: string,
  initial: T,
  revive?: (stored: T | null, initial: T) => T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stored = readListContext<T>(key);
    return revive ? revive(stored, initial) : (stored ?? initial);
  });
  useEffect(() => {
    writeListContext(key, value);
  }, [key, value]);
  return [value, setValue];
}

export function useRouteClient(clientId: string): void {
  useEffect(() => {
    writeRouteClientId(clientId.trim() ? clientId : null);
  }, [clientId]);
}

export function useQueryFilter(key: string): {
  activeFilter: string;
  query: string;
  setActiveFilter: (activeFilter: string) => void;
  setQuery: (query: string) => void;
} {
  const [value, setValue] = useListContext(key, { activeFilter: 'all', query: '' });
  return {
    activeFilter: value.activeFilter,
    query: value.query,
    setActiveFilter: (activeFilter) => setValue((prev) => ({ ...prev, activeFilter })),
    setQuery: (query) => setValue((prev) => ({ ...prev, query })),
  };
}

export function usePersistedQuery(key: string): [string, (query: string) => void] {
  const [value, setValue] = useListContext(key, { query: '' });
  return [value.query, (query) => setValue({ query })];
}

export function reviveClientId(stored: { clientId: string } | null, initial: { clientId: string }): { clientId: string } {
  if (stored?.clientId) return stored;
  const urlClient = readRouteClientId();
  if (urlClient) return { clientId: urlClient };
  return stored ?? initial;
}

import { matchesSearch, normalizeSearch } from '../text/normalize-search';
import { slicePage, type PageSlice } from './page-query';

export function pageByName<T extends { id: string; name: string }>(
  items: T[],
  query: { cursor?: string; limit?: number; search?: string },
): PageSlice<T> {
  const filtered = items.filter((item) => matchesSearch(item.name, query.search));
  return slicePage(filtered, query, {
    direction: 'asc',
    id: (item) => item.id,
    sort: (item) => normalizeSearch(item.name),
  });
}

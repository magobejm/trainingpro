import { matchesSearch, normalizeSearch } from '../../../common/text/normalize-search';
import { orderByKey } from '../../../common/pagination/page-query';
import type { Client } from './client';

export type ClientListSort = 'activity' | 'name';

export type ListClientsQuery = {
  cursor?: string;
  limit?: number;
  objective?: string;
  search?: string;
  sort?: ClientListSort;
};

export function selectClients(clients: Client[], query: ListClientsQuery | undefined): Client[] {
  if (!query || (!query.search && !query.objective && !query.sort)) return clients;
  const filtered = clients.filter((client) => matchesClient(client, query));
  if (query.sort === 'activity') {
    return orderByKey(filtered, {
      direction: 'desc',
      id: (client) => client.id,
      sort: (client) => (client.lastActivityAt ? client.lastActivityAt.toISOString() : ''),
    });
  }
  return orderByKey(filtered, {
    direction: 'asc',
    id: (client) => client.id,
    sort: (client) => normalizeSearch(`${client.firstName} ${client.lastName}`),
  });
}

function matchesClient(client: Client, query: ListClientsQuery): boolean {
  const name = `${client.firstName} ${client.lastName}`.trim();
  const objective = (client.objective ?? '').trim();
  const matchesObjective = !query.objective || query.objective === 'ALL' || objective === query.objective;
  return matchesSearch(name, query.search) && matchesObjective;
}

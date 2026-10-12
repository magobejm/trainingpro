import { clientPath, parseShellPath, SHELL_PATHS, type ClientMode } from '../../layout/shell-routes';

/** Pantallas de la sección Clientes: la lista y, para un cliente, su ficha y subpantallas. */
export type ScreenMode = 'list' | 'mood' | 'nutrition' | 'profile' | 'profileEdit' | 'tests';

const MODE_BY_SEGMENT: Partial<Record<ClientMode, ScreenMode>> = {
  edit: 'profileEdit',
  mood: 'mood',
  nutrition: 'nutrition',
  tests: 'tests',
};

const SEGMENT_BY_MODE: Partial<Record<ScreenMode, ClientMode>> = {
  mood: 'mood',
  nutrition: 'nutrition',
  profileEdit: 'edit',
  tests: 'tests',
};

/** Qué cliente y qué pantalla de Clientes corresponden a una dirección. */
export function readClientsLocation(pathname: string): { screenMode: ScreenMode; selectedClientId: string } {
  const parsed = parseShellPath(pathname);
  if (!parsed || parsed.route !== 'coach.clients' || !parsed.clientId) {
    return { screenMode: 'list', selectedClientId: '' };
  }
  const screenMode = parsed.clientMode ? (MODE_BY_SEGMENT[parsed.clientMode] ?? 'profile') : 'profile';
  return { screenMode, selectedClientId: parsed.clientId };
}

/** Dirección de una pantalla de Clientes; sin cliente (o en modo lista) es la lista. */
export function clientsScreenPath(clientId: string, mode: ScreenMode): string {
  if (!clientId || mode === 'list') return SHELL_PATHS['coach.clients'];
  return clientPath(clientId, SEGMENT_BY_MODE[mode] ?? null);
}

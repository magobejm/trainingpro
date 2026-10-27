import { clientPath, SHELL_PATHS, type ClientMode } from './shell-routes';

export type Crumb = { label: string; to: null | string };

export type ClientCrumbMode = 'chat' | 'incidents' | 'profile' | 'routine' | ClientMode;

type Translate = (key: string) => string;

const MODE_LABEL_KEYS: Record<ClientCrumbMode, string> = {
  chat: 'coach.clientProfile.details.chat.title',
  edit: 'coach.clientProfile.edit.title',
  incidents: 'coach.clientProfile.details.incidents.title',
  mood: 'coach.clientProfile.details.mood.title',
  nutrition: 'coach.nutrition.client.title',
  profile: 'coach.clientProfile.title',
  progress: 'app.nav.coach.progress',
  routine: 'coach.routine.title',
  tests: 'coach.clientProfile.details.tests.title',
};

/**
 * Migas de pan de las pantallas de un cliente: "Clientes › Ana López › Progreso".
 * Todas las migas menos la última llevan a su pantalla; la de la ficha es un enlace
 * salvo cuando ya estás en ella.
 */
export function buildClientCrumbs(input: {
  clientId: string;
  clientName: string;
  mode: ClientCrumbMode;
  t: Translate;
}): Crumb[] {
  const clientsLabel = input.t('coach.clients.title');
  const crumbs: Crumb[] = [{ label: clientsLabel, to: SHELL_PATHS['coach.clients'] }];
  const name = input.clientName.trim() || clientsLabel;
  crumbs.push({ label: name, to: input.mode === 'profile' ? null : clientPath(input.clientId, null) });
  if (input.mode !== 'profile') {
    crumbs.push({ label: input.t(MODE_LABEL_KEYS[input.mode]), to: null });
  }
  return crumbs;
}

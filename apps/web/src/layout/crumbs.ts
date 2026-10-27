import { clientPath, SHELL_PATHS, type ClientMode } from './shell-routes';

export type Crumb = { label: string; onPress?: () => void; to: null | string };

export type ClientCrumbMode = 'chat' | 'incidents' | 'profile' | 'routine' | ClientMode;

type Translate = (key: string) => string;

const MODE_LABEL_KEYS: Record<ClientCrumbMode, string> = {
  chat: 'coach.clientProfile.details.chat.title',
  compare: 'coach.compare.title',
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

/**
 * Migas al profundizar en el progreso: "… › Progreso › Rutina › Ejercicio".
 * Progreso y la rutina vuelven al nivel anterior; el último tramo es la página actual.
 */
export function buildProgressDrillCrumbs(input: {
  base: Crumb[];
  exerciseLabel: string | null;
  onProgress: () => void;
  onRoutine: () => void;
  routineLabel: string | null;
}): Crumb[] {
  if (!input.routineLabel && !input.exerciseLabel) return input.base;
  const progress = input.base.at(-1);
  if (!progress) return input.base;
  const trail: Crumb[] = [...input.base.slice(0, -1), { ...progress, onPress: input.onProgress, to: null }];
  if (input.routineLabel && input.exerciseLabel) {
    trail.push({ label: input.routineLabel, onPress: input.onRoutine, to: null });
  }
  const current = input.exerciseLabel ?? input.routineLabel;
  if (current) trail.push({ label: current, to: null });
  return trail;
}

/** Migas de la biblioteca hacia el planificador: "Biblioteca… › Planificador de Rutinas". */
export function buildLibraryPlannerCrumbs(input: { kind: 'routine' | 'warmup'; t: Translate }): Crumb[] {
  const library = input.kind === 'warmup' ? 'coach.library.warmups' : 'coach.library.routines';
  const current = input.kind === 'warmup' ? 'coach.warmupPlanner.title' : 'coach.routine.title';
  return [
    { label: input.t('coach.routineLib.title'), to: SHELL_PATHS[library] },
    { label: input.t(current), to: null },
  ];
}

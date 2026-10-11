export type Probe = {
  name: string;
  path: string;
  query?: Record<string, string>;
  role: 'client' | 'coach';
};

export type PerfManifest = {
  clientId: string;
  exerciseId: string;
  templateId: string;
  threadId: string;
};

export function buildProbes(manifest: PerfManifest, from: string, to: string, gridFrom: string): Probe[] {
  const client = manifest.clientId;
  const progress = { clientId: client, from, to };
  return [
    { name: 'clients.list', path: '/clients', role: 'coach' },
    { name: 'clients.one', path: `/clients/${client}`, role: 'coach' },
    { name: 'calendar.all', path: '/calendar', query: { dateFrom: gridFrom, dateTo: to }, role: 'coach' },
    {
      name: 'calendar.client',
      path: '/calendar',
      query: { clientId: client, dateFrom: gridFrom, dateTo: to },
      role: 'coach',
    },
    { name: 'me.calendar', path: '/clients/me/calendar', query: { dateFrom: gridFrom, dateTo: to }, role: 'client' },
    { name: 'me.sessions', path: '/clients/me/sessions', query: { dateFrom: gridFrom, dateTo: to }, role: 'client' },
    { name: 'me.summary', path: '/clients/me/calendar-summary', query: { dateFrom: gridFrom, dateTo: to }, role: 'client' },
    { name: 'library.exercises.all', path: '/library/exercises/all', role: 'coach' },
    { name: 'library.exercises', path: '/library/exercises', role: 'coach' },
    { name: 'library.foods', path: '/library/foods', role: 'coach' },
    { name: 'plans.routines', path: '/plans/templates/routines', role: 'coach' },
    { name: 'plans.routines.summary', path: '/plans/templates/routines', query: { summary: 'true' }, role: 'coach' },
    { name: 'plans.cardio', path: '/plans/templates/cardio', role: 'coach' },
    { name: 'plans.warmups', path: '/plans/templates/warmups', role: 'coach' },
    { name: 'progress.overview', path: '/progress/overview', query: progress, role: 'coach' },
    {
      name: 'progress.exercise',
      path: '/progress/exercise',
      query: { ...progress, exerciseId: manifest.exerciseId },
      role: 'coach',
    },
    {
      name: 'progress.pr',
      path: '/progress/exercise-pr',
      query: { clientId: client, exerciseId: manifest.exerciseId },
      role: 'coach',
    },
    { name: 'progress.performed', path: '/progress/performed-exercises', query: progress, role: 'coach' },
    { name: 'progress.templates', path: '/progress/performed-templates', query: progress, role: 'coach' },
    {
      name: 'progress.days',
      path: '/progress/session/days',
      query: { ...progress, templateId: manifest.templateId },
      role: 'coach',
    },
    {
      name: 'progress.session',
      path: '/progress/session',
      query: { ...progress, category: 'strength', templateId: manifest.templateId },
      role: 'coach',
    },
    {
      name: 'progress.microcycle',
      path: '/progress/microcycle',
      query: { ...progress, templateId: manifest.templateId },
      role: 'coach',
    },
    { name: 'progress.recent', path: '/progress/sessions', query: progress, role: 'coach' },
    { name: 'chat.messages', path: '/chat/messages', query: { threadId: manifest.threadId }, role: 'coach' },
  ];
}

export function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

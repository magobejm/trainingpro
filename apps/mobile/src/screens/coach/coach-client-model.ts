export type DirectoryClient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  lastActivityAt?: string | null;
  archivedAt?: string | null;
  status?: string | { level: string };
};
export type ClientFilter = 'active' | 'archived' | 'all';
export type ClientOrder = 'name' | 'activity';
export function filterCoachClients<T extends DirectoryClient>(
  rows: T[],
  search: string,
  filter: ClientFilter,
  order: ClientOrder,
): T[] {
  const query = search.trim().toLocaleLowerCase();
  const archived = (c: T) => Boolean(c.archivedAt) || c.status === 'ARCHIVED';
  return rows
    .filter(
      (c) =>
        (filter === 'all' || (filter === 'archived') === archived(c)) &&
        (!query || [c.firstName, c.lastName, c.email].join(' ').toLocaleLowerCase().includes(query)),
    )
    .sort((a, b) => {
      const activity =
        order === 'activity' ? (Date.parse(b.lastActivityAt ?? '') || 0) - (Date.parse(a.lastActivityAt ?? '') || 0) : 0;
      return (
        activity ||
        [a.firstName, a.lastName].join(' ').localeCompare([b.firstName, b.lastName].join(' ')) ||
        a.id.localeCompare(b.id)
      );
    });
}
export const emptyClientForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  sex: '',
  objectiveId: '',
  secondaryObjectives: '',
  fitnessLevel: '',
  heightCm: '',
  weightKg: '',
  waistCm: '',
  hipCm: '',
  fcMax: '',
  fcRest: '',
  injuries: '',
  allergies: '',
  considerations: '',
  notes: '',
};
export type CoachClientForm = typeof emptyClientForm;
export function clientFormPayload(form: CoachClientForm, editing: boolean): Record<string, unknown> {
  if (!form.firstName.trim() || !form.lastName.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim()))
    throw new Error('coach.clients.invalidRequired');
  if (form.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.birthDate)) throw new Error('coach.clients.invalidDate');
  const payload: Record<string, unknown> = {
    ...form,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    objectiveId: form.objectiveId || null,
    secondaryObjectives: form.secondaryObjectives
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
  for (const name of ['heightCm', 'weightKg', 'waistCm', 'hipCm', 'fcMax', 'fcRest'] as const) {
    const value = form[name].trim();
    const num = value ? Number(value) : null;
    if (num !== null && !Number.isFinite(num)) throw new Error('coach.clients.invalidNumber');
    payload[name] = num;
  }
  if (!form.birthDate) {
    if (editing) payload.birthDate = null;
    else delete payload.birthDate;
  }
  return payload;
}
export function clientToForm(client: Record<string, unknown>): CoachClientForm {
  const form = { ...emptyClientForm };
  for (const key of Object.keys(form) as (keyof CoachClientForm)[]) {
    const value = client[key];
    form[key] = Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value);
  }
  return form;
}
export function isOwnChatMessage(role: string | null, senderRole: string): boolean {
  return role?.toUpperCase() === senderRole;
}
export function canRespondToCall(role: string | null, proposal: { status: string; lastProposedBy: string }): boolean {
  return Boolean(role) && proposal.status === 'pending' && proposal.lastProposedBy !== role?.toUpperCase();
}

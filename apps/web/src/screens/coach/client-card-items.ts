import type { BadgeTone, ClientCardItem } from '@trainerpro/ui';
import type { ClientStatus } from '@trainerpro/shared';
import type { ClientView } from '../../data/hooks/useClientsQuery';

type Translate = (key: string, options?: Record<string, number | string>) => string;
const STATUS_TONE: Record<ClientStatus['level'], BadgeTone> = {
  amber: 'warning',
  green: 'success',
  none: 'neutral',
  red: 'danger',
};

export function clientCardItems(clients: ClientView[], t: Translate): ClientCardItem[] {
  return clients.map((client) => ({
    id: client.id,
    title: (client.firstName + ' ' + client.lastName).trim(),
    avatarUrl: client.avatarUrl,
    subtitle: client.email,
    objective: client.objective || t('coach.clients.card.objectiveEmpty'),
    statusDot: clientStatusDot(client, t),
    statusTone: client.trainingPlanId ? 'success' : 'warning',
    statusLabel: t(client.trainingPlanId ? 'coach.clients.card.planAssigned' : 'coach.clients.card.planPending'),
  }));
}

export function clientStatusDot(
  client: Pick<ClientView, 'status'>,
  t: Translate,
): { reason: string; tone: BadgeTone } | undefined {
  const status = client.status;
  if (!status) return undefined;
  const details = status.reasons.map((reason) => reasonText(reason, t));
  const headline = t(`coach.clients.status.${status.level}`);
  return { reason: details.length ? `${headline}. ${details.join('. ')}` : headline, tone: STATUS_TONE[status.level] };
}

function reasonText(reason: ClientStatus['reasons'][number], t: Translate): string {
  if (reason.code === 'inactive' && reason.days === undefined) return t('coach.clients.status.reason.inactiveNever');
  return t(`coach.clients.status.reason.${reason.code}`, {
    days: reason.days ?? 0,
    mood: reason.mood ?? 0,
    percent: reason.adherencePercent ?? 0,
  });
}

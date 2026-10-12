import type { ClientCardItem } from '@trainerpro/ui';
import type { ClientView } from '../../data/hooks/useClientsQuery';
export function clientCardItems(clients: ClientView[], t: (key: string) => string): ClientCardItem[] {
  return clients.map((client) => ({
    id: client.id,
    title: (client.firstName + ' ' + client.lastName).trim(),
    avatarUrl: client.avatarUrl,
    subtitle: client.email,
    objective: client.objective || t('coach.clients.card.objectiveEmpty'),
    statusTone: client.trainingPlanId ? 'success' : 'warning',
    statusLabel: t(client.trainingPlanId ? 'coach.clients.card.planAssigned' : 'coach.clients.card.planPending'),
  }));
}

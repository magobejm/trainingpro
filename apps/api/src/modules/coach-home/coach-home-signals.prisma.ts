import { routineAlert } from '@trainerpro/shared';
import { readWorkoutAdherenceBatch } from '../../common/plan/workout-adherence.prisma';
import type { PrismaService } from '../../common/prisma/prisma.service';

type ClientRef = { activeRoutineAssignmentId: null | string; id: string; trainingPlanId: null | string };

const DAY_MS = 86_400_000;

export function dayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function dateOnly(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export async function readUnreadChats(prisma: PrismaService, coachMembershipId: string, clientIds: string[]) {
  const threads = await prisma.chatThread.findMany({
    select: { clientId: true, coachLastReadAt: true, id: true },
    where: { archivedAt: null, clientId: { in: clientIds }, coachMembershipId },
  });
  if (!threads.length) return [];
  const rows = await prisma.chatMessage.groupBy({
    _min: { createdAt: true },
    by: ['threadId'],
    where: {
      OR: threads.map((thread) => ({
        threadId: thread.id,
        ...(thread.coachLastReadAt ? { createdAt: { gt: thread.coachLastReadAt } } : {}),
      })),
      senderRole: 'CLIENT',
    },
  });
  const clientByThread = new Map(threads.map((thread) => [thread.id, thread.clientId]));
  return rows.flatMap((row) => {
    const clientId = clientByThread.get(row.threadId);
    return clientId && row._min.createdAt ? [{ clientId, since: row._min.createdAt.toISOString() }] : [];
  });
}

export async function readAdherenceSignals(prisma: PrismaService, clients: ClientRef[], now: Date) {
  const today = dateOnly(now);
  const monday = new Date(today);
  monday.setUTCDate(monday.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  const yesterday = new Date(today.getTime() - DAY_MS);
  const withRoutine = clients.filter((client) => client.activeRoutineAssignmentId || client.trainingPlanId);
  const ids = withRoutine.map((client) => client.id);
  const [week, lastDone] = await Promise.all([
    readWorkoutAdherenceBatch(prisma, ids, { from: monday, to: yesterday }, now),
    prisma.sessionInstance.groupBy({
      _max: { finishedAt: true },
      by: ['clientId'],
      where: { archivedAt: null, clientId: { in: ids }, isCompleted: true },
    }),
  ]);
  const last = new Map(lastDone.map((row) => [row.clientId, row._max.finishedAt]));
  return new Map(
    ids.map((id) => {
      const finished = last.get(id);
      const percent = week.get(id)?.percent ?? null;
      return [
        id,
        {
          daysWithoutWorkout: finished ? Math.floor((today.getTime() - dateOnly(finished).getTime()) / DAY_MS) : null,
          weekAdherence: percent == null ? null : percent / 100,
        },
      ];
    }),
  );
}

export async function readRoutineAlerts(prisma: PrismaService, clients: ClientRef[], now: Date) {
  const today = dateOnly(now);
  const rows = await prisma.calendarEvent.groupBy({
    _max: { date: true },
    by: ['clientId'],
    where: { archivedAt: null, clientId: { in: clients.map((client) => client.id) }, date: { gte: today }, type: 'workout' },
  });
  const last = new Map(rows.map((row) => [row.clientId, row._max.date]));
  return clients.flatMap((client) => {
    const lastDate = last.get(client.id);
    const alert = routineAlert({
      hasRoutine: Boolean(client.activeRoutineAssignmentId || client.trainingPlanId),
      lastWorkoutDay: lastDate ? dayKey(lastDate) : null,
      today: dayKey(today),
    });
    return alert ? [{ alert, clientId: client.id }] : [];
  });
}

export async function readClientsWithoutNutrition(prisma: PrismaService, clientIds: string[]) {
  const plans = await prisma.nutritionPlan.findMany({
    distinct: ['clientId'],
    select: { clientId: true },
    where: { archivedAt: null, clientId: { in: clientIds } },
  });
  const withPlan = new Set(plans.map((plan) => plan.clientId));
  return clientIds.filter((id) => !withPlan.has(id));
}

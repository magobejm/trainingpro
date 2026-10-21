import { sessionDateKey } from '@trainerpro/shared';
import type { PrismaService } from '../prisma/prisma.service';
import { adherenceCutoff, calculateWorkoutAdherence } from './workout-adherence';
import { closeStaleSessions } from '../../modules/sessions/infra/prisma/session-stale';

export type WorkoutAdherenceInput = {
  clientId: string;
  from: Date;
  to: Date;
  templateId?: string;
  timezoneOffset?: number;
};

export async function readWorkoutAdherence(prisma: PrismaService, input: WorkoutAdherenceInput, now = new Date()) {
  const summaries = await readWorkoutAdherenceBatch(prisma, [input.clientId], input, now);
  return summaries.get(input.clientId)!;
}

export async function readWorkoutAdherenceBatch(
  prisma: PrismaService,
  clientIds: string[],
  input: Omit<WorkoutAdherenceInput, 'clientId'>,
  now = new Date(),
) {
  if (clientIds.length) await closeStaleSessions(prisma, { clientIds }, now);
  const from = sessionDateKey(input.from);
  const to = sessionDateKey(input.to);
  const cutoff = adherenceCutoff(to, now, input.timezoneOffset);
  const whereDate = { gte: input.from, lte: new Date(`${cutoff}T00:00:00.000Z`) };
  const [events, sessions] =
    cutoff < from || !clientIds.length
      ? [[], []]
      : await Promise.all([
          prisma.calendarEvent.findMany({
            where: { clientId: { in: clientIds }, archivedAt: null, type: 'workout', date: whereDate },
            select: {
              id: true,
              clientId: true,
              date: true,
              originDate: true,
              planDayId: true,
              planDay: { select: { templateId: true } },
            },
          }),
          prisma.sessionInstance.findMany({
            where: { clientId: { in: clientIds }, archivedAt: null, sessionDate: whereDate },
            select: {
              id: true,
              clientId: true,
              sessionDate: true,
              planDayId: true,
              isCompleted: true,
              isIncomplete: true,
              status: true,
              skippedAt: true,
              skipReason: true,
              updatedAt: true,
              sourceTemplateId: true,
            },
          }),
        ]);
  return new Map(
    clientIds.map((clientId) => {
      const clientEvents = events.filter((event) => event.clientId === clientId);
      const clientSessions = sessions.filter((session) => session.clientId === clientId);
      // Resolve against the complete day's agenda before applying a template filter:
      // narrowing first would make an ambiguous legacy session look unambiguous.
      const selectedEvents = input.templateId
        ? clientEvents.filter((event) => event.planDay?.templateId === input.templateId)
        : clientEvents;
      const selectedSessions = input.templateId
        ? clientSessions.filter((session) => session.sourceTemplateId === input.templateId)
        : clientSessions;
      return [
        clientId,
        calculateWorkoutAdherence(selectedEvents, selectedSessions, from, to, cutoff, clientEvents, clientSessions),
      ];
    }),
  );
}

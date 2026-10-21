import { resolveWorkoutResults, sessionDateKey, type WorkoutSession } from '@trainerpro/shared';
import type { Prisma } from '@prisma/client';

export async function readSessionOrigins(
  prisma: Prisma.TransactionClient,
  sessions: WorkoutSession[],
): Promise<Map<string, string | null>> {
  const origins = new Map<string, string | null>();
  if (!sessions.length) return origins;
  const dates = sessions.map((row) => sessionDateKey(row.sessionDate)).sort();
  const events = await prisma.calendarEvent.findMany({
    where: {
      archivedAt: null,
      type: 'workout',
      clientId: { in: [...new Set(sessions.map((row) => row.clientId))] },
      date: { gte: new Date(dates[0]!), lte: new Date(dates[dates.length - 1]!) },
    },
    select: { id: true, clientId: true, date: true, planDayId: true, originDate: true },
  });
  const matches = resolveWorkoutResults(events, sessions);
  for (const session of sessions) {
    const matching = events.filter((event) => matches.get(event.id)?.sessionId === session.id);
    const values = new Set(matching.map((event) => (event.originDate ? sessionDateKey(event.originDate) : null)));
    origins.set(session.id, values.size === 1 ? [...values][0]! : null);
  }
  return origins;
}

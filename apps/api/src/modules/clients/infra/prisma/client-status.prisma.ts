import type { PrismaService } from '../../../../common/prisma/prisma.service';
import { computeClientStatus, daysSinceActivity, statusWindowStart, type ClientStatus } from '../../domain/client-status';

const SEVERE = new Set(['CRITICAL', 'HIGH']);

export type ClientStatusFacts = {
  completedSessions: number;
  hasAnySession: boolean;
  latestMood: number | null;
  latestMoodAt: Date | null;
  openIncidents: number;
  plannedSessions: number;
  severeOpenIncidents: number;
};

export async function readClientStatusFacts(
  prisma: PrismaService,
  clientIds: string[],
  now = new Date(),
): Promise<Map<string, ClientStatusFacts>> {
  const facts = new Map(clientIds.map((id) => [id, emptyFacts()]));
  if (!clientIds.length) return facts;
  const windowStart = statusWindowStart(now);
  const windowEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  await Promise.all([
    fillSessions(prisma, clientIds, windowStart, windowEnd, facts),
    fillIncidents(prisma, clientIds, facts),
    fillMood(prisma, clientIds, facts),
    fillAnySession(prisma, clientIds, facts),
  ]);
  return facts;
}

export function statusForClient(input: {
  facts: ClientStatusFacts | undefined;
  hasPlan: boolean;
  lastActivityAt: Date | null;
  now?: Date;
}): ClientStatus {
  const now = input.now ?? new Date();
  const facts = input.facts ?? emptyFacts();
  return computeClientStatus({
    completedSessions: facts.completedSessions,
    daysSinceActivity: daysSinceActivity(input.lastActivityAt, now),
    hasAnySession: facts.hasAnySession,
    hasPlan: input.hasPlan,
    latestMood: facts.latestMood,
    openIncidents: facts.openIncidents,
    plannedSessions: facts.plannedSessions,
    severeOpenIncidents: facts.severeOpenIncidents,
  });
}

function emptyFacts(): ClientStatusFacts {
  return {
    completedSessions: 0,
    hasAnySession: false,
    latestMood: null,
    latestMoodAt: null,
    openIncidents: 0,
    plannedSessions: 0,
    severeOpenIncidents: 0,
  };
}

async function fillSessions(
  prisma: PrismaService,
  clientIds: string[],
  windowStart: Date,
  windowEnd: Date,
  facts: Map<string, ClientStatusFacts>,
): Promise<void> {
  const rows = await prisma.sessionInstance.groupBy({
    _count: { _all: true },
    by: ['clientId', 'status'],
    where: {
      archivedAt: null,
      clientId: { in: clientIds },
      sessionDate: { gte: windowStart, lte: windowEnd },
      status: { in: ['COMPLETED', 'PENDING'] },
    },
  });
  for (const row of rows) {
    const current = facts.get(row.clientId);
    if (!current) continue;
    current.plannedSessions += row._count._all;
    if (row.status === 'COMPLETED') current.completedSessions += row._count._all;
  }
}

async function fillIncidents(
  prisma: PrismaService,
  clientIds: string[],
  facts: Map<string, ClientStatusFacts>,
): Promise<void> {
  const rows = await prisma.incident.groupBy({
    _count: { _all: true },
    by: ['clientId', 'severity'],
    where: { archivedAt: null, clientId: { in: clientIds }, status: 'OPEN' },
  });
  for (const row of rows) {
    const current = facts.get(row.clientId);
    if (!current) continue;
    current.openIncidents += row._count._all;
    if (SEVERE.has(row.severity)) current.severeOpenIncidents += row._count._all;
  }
}

async function fillMood(prisma: PrismaService, clientIds: string[], facts: Map<string, ClientStatusFacts>): Promise<void> {
  const [sessions, reports] = await Promise.all([
    prisma.sessionInstance.findMany({
      distinct: ['clientId'],
      orderBy: { sessionDate: 'desc' },
      select: { clientId: true, postMood: true, sessionDate: true },
      where: { archivedAt: null, clientId: { in: clientIds }, postMood: { not: null } },
    }),
    prisma.weeklyReport.findMany({
      distinct: ['clientId'],
      orderBy: { reportDate: 'desc' },
      select: { clientId: true, mood: true, reportDate: true },
      where: { clientId: { in: clientIds }, mood: { not: null } },
    }),
  ]);
  for (const row of sessions) rememberMood(facts, row.clientId, row.postMood, row.sessionDate);
  for (const row of reports) rememberMood(facts, row.clientId, row.mood, row.reportDate);
}

async function fillAnySession(
  prisma: PrismaService,
  clientIds: string[],
  facts: Map<string, ClientStatusFacts>,
): Promise<void> {
  const rows = await prisma.sessionInstance.groupBy({
    _count: { _all: true },
    by: ['clientId'],
    where: { archivedAt: null, clientId: { in: clientIds } },
  });
  for (const row of rows) {
    const current = facts.get(row.clientId);
    if (current && row._count._all > 0) current.hasAnySession = true;
  }
}

function rememberMood(facts: Map<string, ClientStatusFacts>, clientId: string, mood: number | null, at: Date): void {
  const current = facts.get(clientId);
  if (!current || mood === null) return;
  if (current.latestMoodAt && current.latestMoodAt.getTime() >= at.getTime()) return;
  current.latestMood = mood;
  current.latestMoodAt = at;
}

/* eslint-disable @typescript-eslint/no-explicit-any, max-len */
/**
 * Seed fake session data (SessionInstance + SetLog + SessionCardioBlock + IntervalLog)
 * for all existing non-archived clients. Generates ~24 sessions spread over the last
 * 90 days with progressively increasing weights to simulate real training progress.
 */
import { PrismaClient, SessionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

// IDs of global routine templates from v1-routine-templates.seed.ts
const GLOBAL_TEMPLATE_ID = '00000072-0001-0000-0000-000000000001';

// Exercise IDs from v1-exercises.seed.ts — IDs must match the actual library records
const SEED_EXERCISES: Array<{ id: string; name: string; baseWeightKg: number }> = [
  { id: '1948fa92-9b32-4ddf-bfe6-6b963f452799', name: 'Press de banca plano', baseWeightKg: 70 },
  { id: '3baa2ca8-0fbc-4f34-839e-ce54e2570133', name: 'Sentadilla con barra', baseWeightKg: 80 },
  { id: 'd61cfea3-e4a7-48ce-afef-6687bec20a95', name: 'Remo con barra', baseWeightKg: 60 },
  { id: '73dbe389-4924-48f7-a98c-6ed7a6dc078c', name: 'Dominadas', baseWeightKg: 0 },
  { id: '8376c8ce-1c0f-46fd-ac26-889766a17f39', name: 'Peso muerto rumano', baseWeightKg: 65 },
];

// Cardio method IDs from v1-cardio-methods.seed.ts
// We'll look these up dynamically
const SESSION_COUNT = 24;

/** Returns a Date N days before today */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/** Spread sessions over the last 90 days — every 3-4 days with some jitter */
function buildSessionDates(): Date[] {
  const dates: Date[] = [];
  let day = 3;
  for (let i = 0; i < SESSION_COUNT; i++) {
    dates.push(daysAgo(90 - day));
    day += 3 + (i % 4 === 0 ? 1 : 0);
  }
  return dates;
}

/** Clamp and round helper */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Simulate weight progression: starts at base, increases ~1.5% per session.
 * Adds slight randomness for natural variation.
 */
function progressiveWeight(baseKg: number, sessionIndex: number): number {
  const growth = baseKg * 0.015 * sessionIndex;
  const jitter = (Math.random() - 0.3) * 2.5;
  return round2(Math.max(baseKg, baseKg + growth + jitter));
}

/** RPE stays mostly stable with minor variation (7-9 range) */
function progressiveRpe(sessionIndex: number): number {
  const base = 7.5 + (sessionIndex % 5) * 0.1;
  const jitter = (Math.random() - 0.5) * 0.8;
  return Math.min(10, Math.max(6, round2(base + jitter)));
}

/** Reps per set, slight downward trend as weight rises */
function repsForSet(sessionIndex: number, setIndex: number): number {
  const base = 8 - Math.floor(sessionIndex / 8);
  return Math.max(4, base - (setIndex === 2 ? 1 : 0) + (Math.random() > 0.7 ? 1 : 0));
}

async function createStrengthLogs(prisma: PrismaClient, sessionId: string, sessionIndex: number): Promise<void> {
  const exerciseCount = Math.min(SEED_EXERCISES.length, 4 + (sessionIndex % 2));
  for (let exIdx = 0; exIdx < exerciseCount; exIdx++) {
    const exercise = SEED_EXERCISES[exIdx % SEED_EXERCISES.length];
    const baseWeight = exercise.baseWeightKg;
    const itemId = randomUUID();
    const setCount = 3 + (sessionIndex % 3 === 0 ? 1 : 0);

    await (prisma as any).sessionStrengthItem.create({
      data: {
        id: itemId,
        sessionId,
        sourceExerciseId: exercise.id,
        displayName: exercise.name,
        sortOrder: exIdx,
        setsPlanned: setCount,
        repsMin: 6,
        repsMax: 10,
        weightRangeMinKg: baseWeight > 0 ? baseWeight : null,
        weightRangeMaxKg: baseWeight > 0 ? baseWeight + 10 : null,
      },
    });

    for (let setIdx = 0; setIdx < setCount; setIdx++) {
      const weight = baseWeight > 0 ? progressiveWeight(baseWeight, sessionIndex) : null;
      await (prisma as any).setLog.create({
        data: {
          id: randomUUID(),
          sessionId,
          sessionItemId: itemId,
          setIndex: setIdx + 1,
          repsDone: repsForSet(sessionIndex, setIdx),
          weightDoneKg: weight !== null ? weight : null,
          effortRpe: Math.round(progressiveRpe(sessionIndex)),
        },
      });
    }
  }
}

async function createCardioLogs(
  prisma: PrismaClient,
  sessionId: string,
  sessionIndex: number,
  cardioMethods: Array<{ id: string }>,
): Promise<void> {
  if (cardioMethods.length === 0 || sessionIndex % 3 === 2) return;

  const method = cardioMethods[sessionIndex % cardioMethods.length];
  const cardioBlockId = randomUUID();
  await (prisma as any).sessionCardioBlock.create({
    data: {
      id: cardioBlockId,
      sessionId,
      sourceCardioMethodId: method.id,
      displayName: 'Cinta de correr',
      sortOrder: 0,
      roundsPlanned: 1,
      workSeconds: 1200 + sessionIndex * 30,
      restSeconds: 0,
      targetRpe: 6,
    },
  });

  const avgHr = 140 + Math.floor(Math.random() * 20) - sessionIndex;
  await (prisma as any).intervalLog.create({
    data: {
      id: randomUUID(),
      sessionId,
      sessionCardioBlockId: cardioBlockId,
      intervalIndex: 1,
      durationSecondsDone: 1200 + sessionIndex * 30,
      distanceDoneMeters: 3000 + sessionIndex * 100,
      effortRpe: 6,
      avgHeartRate: Math.max(100, avgHr),
    },
  });
}

export async function seedSessions(prisma: PrismaClient): Promise<void> {
  console.log('Seeding session data...');

  // Find all active clients
  const clients = await (prisma as any).client.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      coachMembershipId: true,
      organizationId: true,
      createdBy: true,
      updatedBy: true,
    },
  });

  if (clients.length === 0) {
    console.log('  No clients found, skipping session seed.');
    return;
  }

  // Find a cardio method to use
  const cardioMethods = await (prisma as any).cardioMethod.findMany({
    take: 3,
    select: { id: true, methodTypeRef: { select: { code: true } } },
  });

  const dates = buildSessionDates();

  let createdCount = 0;

  for (const client of clients) {
    for (let sessionIndex = 0; sessionIndex < dates.length; sessionIndex++) {
      const sessionDate = dates[sessionIndex];

      // Check if session already exists (idempotency)
      const existing = await (prisma as any).sessionInstance.findFirst({
        where: { clientId: client.id, sessionDate },
        select: { id: true },
      });
      if (existing) continue;

      // Verify template still exists
      const templateExists = await (prisma as any).planTemplate.findFirst({
        where: { id: GLOBAL_TEMPLATE_ID },
        select: { id: true, templateVersion: true },
      });
      if (!templateExists) {
        console.log('  Global routine template not found, skipping sessions seed.');
        return;
      }

      const startedAt = new Date(sessionDate.getTime() + 9 * 3600 * 1000); // 9:00 AM
      const durationMinutes = 55 + Math.floor(Math.random() * 20);
      const finishedAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

      const sessionId = randomUUID();

      // Create session
      await (prisma as any).sessionInstance.create({
        data: {
          id: sessionId,
          organizationId: client.organizationId,
          coachMembershipId: client.coachMembershipId,
          clientId: client.id,
          sourceTemplateId: templateExists.id,
          sourceTemplateVersion: templateExists.templateVersion,
          sessionDate,
          startedAt,
          finishedAt,
          isCompleted: true,
          isIncomplete: false,
          status: SessionStatus.COMPLETED,
          createdBy: client.createdBy,
          updatedBy: client.updatedBy,
        },
      });

      await createStrengthLogs(prisma, sessionId, sessionIndex);
      await createCardioLogs(prisma, sessionId, sessionIndex, cardioMethods);

      createdCount++;
    }
  }

  console.log(`  Created ${createdCount} session instances with logs.`);
}

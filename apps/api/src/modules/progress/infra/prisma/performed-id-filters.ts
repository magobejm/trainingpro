import type { Prisma } from '@prisma/client';
type SessionWhere = Prisma.SessionInstanceWhereInput;

const positive = { gt: 0 };

export function strengthPerformedWhere(session: SessionWhere) {
  return {
    archivedAt: null,
    logs: {
      some: {
        OR: [{ repsDone: { gte: 0 } }, { weightDoneKg: { gte: 0 } }, { effortRpe: positive }, { effortRir: { gte: 0 } }],
      },
    },
    session,
    sourceExerciseId: { not: null },
  };
}

export function cardioPerformedWhere(session: SessionWhere) {
  return {
    archivedAt: null,
    OR: [
      { distanceDoneMeters: { gte: 0 } },
      {
        intervalLogs: {
          some: {
            OR: [
              { durationSecondsDone: { gte: 0 } },
              { distanceDoneMeters: { gte: 0 } },
              { effortRpe: positive },
              { avgHeartRate: positive },
              { hrMaxPctDone: { gte: 0 } },
              { hrReservePctDone: { gte: 0 } },
            ],
          },
        },
      },
    ],
    session,
    sourceCardioMethodId: { not: null },
  };
}

export function plioPerformedWhere(session: SessionWhere) {
  return {
    archivedAt: null,
    logs: {
      some: {
        OR: [
          { repsDone: { gte: 0 } },
          { weightDoneKg: { gte: 0 } },
          { effortRpe: positive },
          { durationSecondsDone: { gte: 0 } },
        ],
      },
    },
    session,
    sourcePlioExerciseId: { not: null },
  };
}

export function mobilityPerformedWhere(session: SessionWhere) {
  return {
    archivedAt: null,
    logs: {
      some: {
        OR: [{ repsDone: { gte: 0 } }, { weightDoneKg: { gte: 0 } }, { effortRpe: positive }, { romDone: { not: '' } }],
      },
    },
    session,
    sourceMobilityExerciseId: { not: null },
  };
}

export function isometricPerformedWhere(session: SessionWhere) {
  return {
    archivedAt: null,
    logs: {
      some: {
        OR: [{ durationSecondsDone: { gte: 0 } }, { weightDoneKg: { gte: 0 } }, { effortRpe: positive }],
      },
    },
    session,
    sourceIsometricExerciseId: { not: null },
  };
}

export function sportPerformedWhere(session: SessionWhere) {
  return {
    archivedAt: null,
    OR: [
      {
        logs: {
          some: {
            OR: [{ durationMinutesDone: positive }, { effortRpe: positive }, { avgHeartRate: positive }],
          },
        },
      },
      {
        setLogs: {
          some: {
            OR: [
              { repsDone: { gte: 0 } },
              { weightDoneKg: { gte: 0 } },
              { effortRpe: positive },
              { effortRir: { gte: 0 } },
              { distanceDoneMeters: { gte: 0 } },
              { durationSecondsDone: { gte: 0 } },
              { heartRateDone: positive },
              { hrMaxPctDone: positive },
              { hrReservePctDone: positive },
              { romDone: { not: '' } },
            ],
          },
        },
      },
    ],
    session,
    sourceSportId: { not: null },
  };
}

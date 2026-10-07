type SessionWhere = {
  archivedAt: null;
  clientId: string;
  isCompleted: boolean;
  sessionDate: { gte: Date; lte: Date };
};

const positive = { gt: 0 };

export function strengthPerformedWhere(session: SessionWhere) {
  return {
    archivedAt: null,
    logs: {
      some: {
        OR: [{ repsDone: positive }, { weightDoneKg: positive }, { effortRpe: positive }, { effortRir: positive }],
      },
    },
    session,
    sourceExerciseId: { not: null },
  };
}

export function cardioPerformedWhere(session: SessionWhere) {
  return {
    archivedAt: null,
    intervalLogs: {
      some: {
        OR: [
          { durationSecondsDone: positive },
          { distanceDoneMeters: positive },
          { effortRpe: positive },
          { avgHeartRate: positive },
        ],
      },
    },
    session,
    sourceCardioMethodId: { not: null },
  };
}

export function plioPerformedWhere(session: SessionWhere) {
  return {
    archivedAt: null,
    logs: {
      some: {
        OR: [{ repsDone: positive }, { weightDoneKg: positive }, { effortRpe: positive }, { durationSecondsDone: positive }],
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
        OR: [{ repsDone: positive }, { weightDoneKg: positive }, { effortRpe: positive }, { romDone: { not: '' } }],
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
        OR: [{ durationSecondsDone: positive }, { weightDoneKg: positive }, { effortRpe: positive }],
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
              { repsDone: positive },
              { weightDoneKg: positive },
              { effortRpe: positive },
              { effortRir: positive },
              { durationSecondsDone: positive },
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

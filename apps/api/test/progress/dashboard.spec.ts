import { ProgressDashboardService } from '../../src/modules/progress/application/progress-dashboard.service';

const auth = { activeRole: 'coach', subject: 'coach' } as never;
const assignment = (id: string, appliedAt: string, version = 1) => ({
  id,
  appliedAt: new Date(appliedAt),
  revisionId: `rev-${version}`,
  revision: {
    id: `rev-${version}`,
    templateId: 'template',
    name: `Rutina ${version}`,
    version,
    content: {
      expectedCompletionDays: 10,
      days: [{ dayIndex: 1, title: 'Fuerza', exercises: [{ exerciseLibraryId: 'ex', displayName: 'Press' }] }],
    },
  },
});
// The suite groups independent cases with a shared mocked repository.
// eslint-disable-next-line max-lines-per-function
describe('progress dashboard', () => {
  const repo = { resolveProgressClient: jest.fn().mockResolvedValue('client') };
  const prisma = {
    routineAssignment: { findMany: jest.fn() },
    client: { findUnique: jest.fn() },
    sessionInstance: { findMany: jest.fn(), findFirst: jest.fn(), groupBy: jest.fn() },
    calendarEvent: { findMany: jest.fn(), findFirst: jest.fn() },
    routineRevision: { findMany: jest.fn() },
  };
  const service = new ProgressDashboardService(prisma as never, repo as never);
  afterEach(() => jest.useRealTimers());
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.routineAssignment.findMany.mockResolvedValue([assignment('new', '2026-10-11'), assignment('old', '2026-10-01')]);
    prisma.client.findUnique.mockResolvedValue({ activeRoutineAssignmentId: 'new' });
    prisma.sessionInstance.findMany.mockResolvedValue([]);
    prisma.sessionInstance.findFirst.mockResolvedValue(null);
    prisma.sessionInstance.groupBy.mockResolvedValue([]);
    prisma.routineRevision.findMany.mockResolvedValue([]);
    prisma.calendarEvent.findMany.mockResolvedValue([]);
    prisma.calendarEvent.findFirst.mockResolvedValue(null);
  });
  it('separates repeated applications and freezes each historical interval and outline', async () => {
    const result = await service.catalog(auth, 'client');
    expect(result.routines).toHaveLength(2);
    expect(result.routines[1]).toMatchObject({
      assignmentId: 'old',
      from: '2026-10-01',
      to: '2026-10-11',
      cycleDays: 10,
      active: false,
    });
    const detail = await service.routine(auth, 'old', 'client');
    expect(detail.days[0]?.exercises[0]).toMatchObject({ exerciseId: 'ex', name: 'Press', exerciseType: 'strength' });
  });
  it('anchors an initial captured assignment to earlier history and scheduled dates without moving reapplications', async () => {
    prisma.routineAssignment.findMany.mockResolvedValue([
      assignment('reapplied', '2026-10-15'),
      { ...assignment('captured', '2026-10-11'), initial: true },
    ]);
    prisma.sessionInstance.groupBy.mockResolvedValue([
      {
        sourceTemplateId: 'template',
        sourceTemplateVersion: 1,
        _min: { sessionDate: new Date('2025-01-03') },
        _max: { sessionDate: new Date('2026-10-20') },
      },
    ]);
    prisma.calendarEvent.findFirst.mockResolvedValue({ date: new Date('2025-01-01') });
    const result = await service.catalog(auth, 'client');
    expect(result.routines.find((row) => row.assignmentId === 'captured')).toMatchObject({
      from: '2025-01-01',
      to: '2026-10-15',
    });
    expect(result.routines.find((row) => row.assignmentId === 'reapplied')?.from).toBe('2026-10-15');
    await service.routine(auth, 'captured', 'client');
    expect(prisma.sessionInstance.findMany.mock.calls[0]?.[0].where.sessionDate.gte).toEqual(new Date('2025-01-01'));
    expect(prisma.sessionInstance.findMany.mock.calls[0]?.[0].where.AND[0].OR[1]).toEqual({
      startedAt: { lt: new Date('2026-10-15') },
    });
    prisma.calendarEvent.findFirst.mockResolvedValue(null);
    const withoutSchedule = await service.catalog(auth, 'client');
    expect(withoutSchedule.routines.find((row) => row.assignmentId === 'captured')?.from).toBe('2025-01-03');
  });
  it('includes today in adherence and excludes future programmed days', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-11T12:00:00Z'));
    prisma.calendarEvent.findMany.mockResolvedValue([
      { id: 'event', clientId: 'client', date: new Date('2026-10-11'), planDayId: 'day', originDate: null },
      { id: 'future', clientId: 'client', date: new Date('2026-10-12'), planDayId: 'day', originDate: null },
    ]);
    prisma.sessionInstance.findMany.mockResolvedValue([
      {
        id: 'session',
        clientId: 'client',
        sessionDate: new Date('2026-10-11'),
        planDayId: 'day',
        isCompleted: true,
        isIncomplete: false,
        status: 'COMPLETED',
        sourceTemplateId: 'template',
        planDayIndex: 1,
        planDayTitle: 'Fuerza',
        sessionRpe: 7,
        startedAt: new Date('2026-10-11T10:00:00Z'),
        finishedAt: new Date('2026-10-11T11:00:00Z'),
        items: [],
        cardioBlocks: [],
        plioBlocks: [],
        mobilityBlocks: [],
        isometricBlocks: [],
        sportBlocks: [],
      },
    ]);
    const detail = await service.routine(auth, 'new', 'client');
    expect(detail.cycles[0]?.adherence).toEqual({ planned: 1, done: 1, percent: 100 });
    expect(detail.cycles[0]?.sessions[0]?.trainingLoad).toBe(420);
    jest.useRealTimers();
  });
  it('preserves old revision sessions when it is replaced later on the same day', async () => {
    prisma.routineAssignment.findMany.mockResolvedValue([
      assignment('new', '2026-10-11T12:00:00Z', 2),
      assignment('old', '2026-10-11T08:00:00Z', 1),
    ]);
    prisma.sessionInstance.findMany.mockResolvedValue([
      {
        id: 'old-session',
        clientId: 'client',
        sessionDate: new Date('2026-10-11'),
        planDayTitle: 'Día antiguo',
        planDayIndex: 1,
        isCompleted: true,
        isIncomplete: false,
        items: [],
        cardioBlocks: [],
        plioBlocks: [],
        mobilityBlocks: [],
        isometricBlocks: [],
        sportBlocks: [],
      },
    ]);
    const detail = await service.routine(auth, 'old', 'client');
    expect(detail.routine.to).toBe('2026-10-11');
    expect(detail.cycles[0]?.sessions[0]?.id).toBe('old-session');
    expect(prisma.sessionInstance.findMany.mock.calls[0]?.[0].where.sourceTemplateVersion).toBe(1);
  });
  it('exposes only performed cycles while keeping indices anchored at assignment start', async () => {
    prisma.sessionInstance.findMany.mockResolvedValue([
      {
        id: 'later',
        clientId: 'client',
        sessionDate: new Date('2026-10-31'),
        planDayTitle: 'Día',
        planDayIndex: 1,
        isCompleted: true,
        isIncomplete: false,
        items: [],
        cardioBlocks: [],
        plioBlocks: [],
        mobilityBlocks: [],
        isometricBlocks: [],
        sportBlocks: [],
      },
    ]);
    jest.useFakeTimers().setSystemTime(new Date('2026-11-15T12:00:00Z'));
    const detail = await service.routine(auth, 'new', 'client');
    expect(detail.cycles.map((cycle) => cycle.index)).toEqual([2]);
    jest.useRealTimers();
  });
  it('bounds repeated same-revision applications by actual start time on the handoff date', async () => {
    prisma.routineAssignment.findMany.mockResolvedValue([
      assignment('new', '2026-10-11T12:00:00Z'),
      assignment('old', '2026-10-11T08:00:00Z'),
    ]);
    await service.routine(auth, 'old', 'client');
    expect(prisma.sessionInstance.findMany.mock.calls[0]?.[0].where.AND).toEqual([
      {
        OR: [
          { sessionDate: { lt: new Date('2026-10-11') } },
          { startedAt: { lt: new Date('2026-10-11T12:00:00Z') } },
          { startedAt: null, createdAt: { lt: new Date('2026-10-11T12:00:00Z') } },
        ],
      },
    ]);
  });
  it('recovers an older frozen revision from performed sessions when no assignment exists', async () => {
    prisma.sessionInstance.groupBy.mockResolvedValue([
      {
        sourceTemplateId: 'legacy-template',
        sourceTemplateVersion: 2,
        _min: { sessionDate: new Date('2025-01-01') },
        _max: { sessionDate: new Date('2025-01-11') },
      },
    ]);
    prisma.routineRevision.findMany.mockResolvedValue([
      { ...assignment('legacy', '2025-01-01', 2).revision, id: 'legacy-revision', templateId: 'legacy-template' },
    ]);
    const result = await service.catalog(auth, 'client');
    expect(result.routines.find((item) => item.assignmentId === 'legacy-revision')).toMatchObject({
      from: '2025-01-01',
      to: '2025-01-11',
      active: false,
      version: 2,
    });
  });
  it('aggregates the real daily sets across sessions and retains incomplete provenance', async () => {
    const base = {
      clientId: 'client',
      sessionDate: new Date('2026-10-11'),
      planDayId: 'day',
      isCompleted: true,
      isIncomplete: false,
      status: 'COMPLETED',
      sourceTemplateId: 'template',
      sourceTemplateVersion: 1,
      planDayIndex: 1,
      planDayTitle: 'Fuerza',
      items: [],
      cardioBlocks: [],
      plioBlocks: [],
      mobilityBlocks: [],
      isometricBlocks: [],
      sportBlocks: [],
    };
    prisma.sessionInstance.findMany.mockResolvedValue([
      {
        ...base,
        id: 'a',
        items: [
          {
            id: 'item1',
            sourceExerciseId: 'ex',
            displayName: 'Press',
            logs: [
              { setIndex: 1, repsDone: 5, weightDoneKg: 100, effortRpe: null },
              { setIndex: 2, repsDone: null, weightDoneKg: null, effortRpe: null },
            ],
          },
        ],
      },
      {
        ...base,
        id: 'b',
        isIncomplete: true,
        items: [
          {
            id: 'item2',
            sourceExerciseId: 'ex',
            displayName: 'Press',
            logs: [{ setIndex: 1, repsDone: 10, weightDoneKg: 80, effortRpe: 8 }],
          },
        ],
      },
    ]);
    const result = await service.daily(auth, {
      clientId: 'client',
      exerciseId: 'ex',
      exerciseType: 'strength',
      from: '2026-10-01',
      to: '2026-10-20',
    });
    expect(result.kpis.sessionCount).toBe(2);
    expect(result.points).toHaveLength(1);
    expect(result.points[0]).toMatchObject({ sets: 2, tonnage: 1300, avgRpe: 8 });
    expect(result.points[0]?.audit[1]).toMatchObject({ sessionId: 'b', incomplete: true });
    expect(repo.resolveProgressClient).toHaveBeenCalledWith(auth, 'client');
    expect(prisma.sessionInstance.findMany.mock.calls[0]?.[0].where).toMatchObject({ clientId: 'client', archivedAt: null });
  });
  it('prefers cardio header distance once and excludes empty intervals', async () => {
    prisma.sessionInstance.findMany.mockResolvedValue([
      {
        id: 'a',
        clientId: 'client',
        sessionDate: new Date('2026-10-11'),
        planDayIndex: 1,
        sourceTemplateId: 'template',
        sourceTemplateVersion: 1,
        items: [],
        plioBlocks: [],
        mobilityBlocks: [],
        isometricBlocks: [],
        sportBlocks: [],
        cardioBlocks: [
          {
            id: 'cardio',
            sourceCardioMethodId: 'run',
            displayName: 'Carrera',
            distanceDoneMeters: 5000,
            intervalLogs: [
              { intervalIndex: 1 },
              { intervalIndex: 2, durationSecondsDone: 600, distanceDoneMeters: 999 },
              { intervalIndex: 3, durationSecondsDone: 900, distanceDoneMeters: 999 },
            ],
          },
        ],
      },
    ]);
    const result = await service.daily(auth, {
      exerciseId: 'run',
      exerciseType: 'cardio',
      from: '2026-10-01',
      to: '2026-10-20',
    });
    expect(result.points[0]).toMatchObject({ sets: 2, distanceMeters: 5000, totalDurationSeconds: 1500, avgPaceMinKm: 5 });
    expect(result.points[0]?.audit.map((set) => set.distanceMeters)).toEqual([999, 999]);
  });
  it('recovers a legacy routine outline from immutable session snapshots when its revision is unavailable', async () => {
    prisma.sessionInstance.groupBy.mockResolvedValue([
      {
        sourceTemplateId: 'legacy',
        sourceTemplateVersion: 3,
        _min: { sessionDate: new Date('2025-01-01') },
        _max: { sessionDate: new Date('2025-01-02') },
      },
    ]);
    prisma.sessionInstance.findMany.mockResolvedValue([
      {
        id: 'old-session',
        sessionDate: new Date('2025-01-01'),
        planDayIndex: 1,
        planDayTitle: 'Día antiguo',
        items: [{ id: 'old-item', sourceExerciseId: 'old-exercise', displayName: 'Press antiguo', logs: [] }],
        cardioBlocks: [],
        plioBlocks: [],
        mobilityBlocks: [],
        isometricBlocks: [],
        sportBlocks: [],
      },
    ]);
    const result = await service.catalog(auth, 'client');
    const recovered = result.routines.find((routine) => routine.templateId === 'legacy');
    expect(recovered).toMatchObject({ revisionId: null, version: 3, from: '2025-01-01', to: '2025-01-02' });
    const detail = await service.routine(auth, recovered!.assignmentId, 'client');
    expect(detail.exercises[0]).toMatchObject({ exerciseId: 'old-exercise', name: 'Press antiguo' });
  });
});

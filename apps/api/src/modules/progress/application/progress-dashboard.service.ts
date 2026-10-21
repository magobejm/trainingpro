import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import type {
  ProgressExerciseDaily,
  ProgressExerciseType,
  ProgressRoutine,
  ProgressRoutineCatalog,
  ProgressRoutineDetail,
  ProgressRoutineSession,
} from '@trainerpro/shared';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { AuthContext } from '../../../common/auth-context/auth-context';
import { calculateWorkoutAdherence } from '../../../common/plan/workout-adherence';
import { ProgressRepositoryPrisma } from '../infra/prisma/progress.repository.prisma';
import { aggregateDailyExercise, maxPresent, meanPresent, sumPresent } from '../domain/metrics/daily-exercise';
import { closedSessionWhere } from '../infra/prisma/closed-session';
import {
  DAY,
  key,
  list,
  numeric,
  nonnegative,
  record,
  blockKinds,
  sessionInclude,
  flattenSession,
  type Session,
} from './dashboard-session';

type Assignment = {
  id: string;
  initial?: boolean;
  appliedAt: Date;
  revisionId: string | null;
  revision: { templateId: string; version: number; name: string; content: unknown };
};
type HistorySpan = {
  sourceTemplateId: string;
  sourceTemplateVersion: number;
  _min: { sessionDate: Date | null };
  _max: { sessionDate: Date | null };
};
type CatalogState = { routines: ProgressRoutine[]; assignments: Assignment[] };
export type DailyExerciseQuery = {
  clientId?: string;
  exerciseId: string;
  exerciseType: ProgressExerciseType;
  from: string;
  to: string;
  assignmentId?: string;
  cycles?: number[];
};

function outline(content: unknown): ProgressRoutineDetail['days'] {
  return list(record(content).days).map((day) => ({
    dayIndex: numeric(day.dayIndex) ?? 1,
    title: String(day.title ?? 'Día'),
    exercises: blockKinds.flatMap(([exerciseType, , frozenKey, , libraryKey]) =>
      list(day[frozenKey]).map((block) => ({
        exerciseId: String(block[libraryKey] ?? block.id),
        exerciseType,
        name: String(block.displayName ?? 'Ejercicio'),
      })),
    ),
  }));
}

@Injectable()
export class ProgressDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: ProgressRepositoryPrisma,
  ) {}

  private async initialStart(clientId: string, assignment: Assignment, history: HistorySpan[]): Promise<string> {
    const earliestEvent = await this.prisma.calendarEvent.findFirst({
      where: {
        clientId,
        archivedAt: null,
        type: 'workout',
        date: { lte: new Date(key(assignment.appliedAt)) },
        planDay: { templateId: assignment.revision.templateId, revisionVersion: assignment.revision.version },
      },
      select: { date: true },
      orderBy: { date: 'asc' },
    });
    const span = history.find(
      (row) =>
        row.sourceTemplateId === assignment.revision.templateId && row.sourceTemplateVersion === assignment.revision.version,
    );
    return [assignment.appliedAt, span?._min.sessionDate, earliestEvent?.date]
      .filter((date): date is Date => date != null)
      .map(key)
      .sort()[0]!;
  }

  private async state(clientId: string): Promise<CatalogState> {
    const [assigned, client, history] = await Promise.all([
      this.prisma.routineAssignment.findMany({
        where: { clientId },
        include: { revision: true },
        orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.client.findUnique({ where: { id: clientId }, select: { activeRoutineAssignmentId: true } }),
      this.prisma.sessionInstance.groupBy({
        by: ['sourceTemplateId', 'sourceTemplateVersion'],
        where: { clientId, archivedAt: null, ...closedSessionWhere },
        _min: { sessionDate: true },
        _max: { sessionDate: true },
      }),
    ]);
    const assignments: Assignment[] = [...assigned];
    const initialStarts = new Map(
      await Promise.all(
        assignments
          .filter((assignment) => assignment.initial)
          .map(async (assignment) => [assignment.id, await this.initialStart(clientId, assignment, history)] as const),
      ),
    );
    const routines = assignments.map((assignment, index): ProgressRoutine => {
      const snapshot = record(assignment.revision.content);
      const from = initialStarts.get(assignment.id) ?? key(assignment.appliedAt);
      const next = assignments[index - 1];
      return {
        assignmentId: assignment.id,
        revisionId: assignment.revisionId,
        templateId: assignment.revision.templateId,
        version: assignment.revision.version,
        name: assignment.revision.name,
        from,
        to: next ? key(next.appliedAt) : null,
        active: client?.activeRoutineAssignmentId === assignment.id,
        cycleDays: Math.max(1, Math.floor(numeric(snapshot.expectedCompletionDays) ?? 7)),
        frequency: list(snapshot.days).length,
        objectives: list(snapshot.objectives).map((objective) => String(objective.label ?? '')),
      };
    });
    const orphaned = history.filter(
      (row) =>
        !assigned.some(
          (assignment) =>
            assignment.revision.templateId === row.sourceTemplateId &&
            assignment.revision.version === row.sourceTemplateVersion,
        ),
    );
    const revisions = orphaned.length
      ? await this.prisma.routineRevision.findMany({
          where: { OR: orphaned.map((row) => ({ templateId: row.sourceTemplateId, version: row.sourceTemplateVersion })) },
        })
      : [];
    for (const revision of revisions) {
      const span = orphaned.find(
        (row) => row.sourceTemplateId === revision.templateId && row.sourceTemplateVersion === revision.version,
      );
      if (!span?._min.sessionDate || !span._max.sessionDate) continue;
      const snapshot = record(revision.content);
      assignments.push({ id: revision.id, revisionId: revision.id, revision, appliedAt: span._min.sessionDate });
      routines.push({
        assignmentId: revision.id,
        revisionId: revision.id,
        templateId: revision.templateId,
        version: revision.version,
        name: revision.name,
        from: key(span._min.sessionDate),
        to: key(span._max.sessionDate),
        active: false,
        cycleDays: Math.max(1, Math.floor(numeric(snapshot.expectedCompletionDays) ?? 7)),
        frequency: list(snapshot.days).length,
        objectives: list(snapshot.objectives).map((objective) => String(objective.label ?? '')),
      });
    }
    for (const span of orphaned.filter(
      (row) =>
        !revisions.some(
          (revision) => revision.templateId === row.sourceTemplateId && revision.version === row.sourceTemplateVersion,
        ),
    )) {
      const recovered = await this.recoverLegacy(clientId, span);
      if (recovered) {
        routines.push(recovered.routine);
        assignments.push(recovered.assignment);
      }
    }
    routines.sort((a, b) => b.from.localeCompare(a.from) || b.assignmentId.localeCompare(a.assignmentId));
    return { routines, assignments };
  }

  private async recoverLegacy(clientId: string, span: HistorySpan) {
    if (!span._min.sessionDate || !span._max.sessionDate) return null;
    const sessions = await this.prisma.sessionInstance.findMany({
      where: {
        clientId,
        archivedAt: null,
        ...closedSessionWhere,
        sourceTemplateId: span.sourceTemplateId,
        sourceTemplateVersion: span.sourceTemplateVersion,
      },
      include: sessionInclude,
    });
    const days = new Map<number, Record<string, unknown>>();
    for (const session of sessions) {
      const index = session.planDayIndex ?? 1;
      const day = days.get(index) ?? { dayIndex: index, title: session.planDayTitle ?? `Día ${index}` };
      for (const [, sessionKey, frozenKey, sourceKey, libraryKey] of blockKinds) {
        const prior = list(day[frozenKey]);
        const blocks = list(record(session)[sessionKey]).map((block) => ({
          [libraryKey]: block[sourceKey] ?? block.id,
          displayName: block.displayName,
        }));
        const unique = new Map([...prior, ...blocks].map((block) => [String(block[libraryKey]), block]));
        day[frozenKey] = [...unique.values()];
      }
      days.set(index, day);
    }
    const digest = createHash('sha256')
      .update(`progress:${span.sourceTemplateId}:${span.sourceTemplateVersion}`)
      .digest('hex');
    const id = [
      digest.slice(0, 8),
      digest.slice(8, 12),
      `4${digest.slice(13, 16)}`,
      `8${digest.slice(17, 20)}`,
      digest.slice(20, 32),
    ].join('-');
    const name = `Rutina histórica · v${span.sourceTemplateVersion}`;
    const routine: ProgressRoutine = {
      assignmentId: id,
      revisionId: null,
      templateId: span.sourceTemplateId,
      version: span.sourceTemplateVersion,
      name,
      from: key(span._min.sessionDate),
      to: key(span._max.sessionDate),
      active: false,
      cycleDays: 7,
      frequency: days.size,
      objectives: [],
    };
    const assignment: Assignment = {
      id,
      revisionId: null,
      appliedAt: span._min.sessionDate,
      revision: {
        templateId: span.sourceTemplateId,
        version: span.sourceTemplateVersion,
        name,
        content: { days: [...days.values()], expectedCompletionDays: 7 },
      },
    };
    return { routine, assignment };
  }

  async catalog(context: AuthContext, requestedClientId?: string): Promise<ProgressRoutineCatalog> {
    const clientId = await this.repository.resolveProgressClient(context, requestedClientId);
    const { routines } = await this.state(clientId);
    const earliest = await this.prisma.sessionInstance.findFirst({
      where: { clientId, archivedAt: null, ...closedSessionWhere },
      select: { sessionDate: true },
      orderBy: { sessionDate: 'asc' },
    });
    const dates = [...routines.map((routine) => routine.from), ...(earliest ? [key(earliest.sessionDate)] : [])].sort();
    return { routines, historyFrom: dates[0] ?? null };
  }

  private async sessions(
    clientId: string,
    from: string,
    to: string,
    routine?: ProgressRoutine,
    assignments: Assignment[] = [],
  ): Promise<Session[]> {
    const current = assignments.findIndex((row) => row.id === routine?.assignmentId);
    const assignment = assignments[current];
    const sameRevision = (row?: Assignment) =>
      row && row.revision.templateId === routine?.templateId && row.revision.version === routine?.version;
    const boundaries: Prisma.SessionInstanceWhereInput[] = [];
    if (assignment && sameRevision(assignments[current + 1]))
      boundaries.push({
        OR: [
          { sessionDate: { gt: new Date(routine!.from) } },
          { startedAt: { gte: assignment.appliedAt } },
          { startedAt: null, createdAt: { gte: assignment.appliedAt } },
        ],
      });
    const next = assignments[current - 1];
    if (next && sameRevision(next))
      boundaries.push({
        OR: [
          { sessionDate: { lt: new Date(key(next.appliedAt)) } },
          { startedAt: { lt: next.appliedAt } },
          { startedAt: null, createdAt: { lt: next.appliedAt } },
        ],
      });
    return this.prisma.sessionInstance.findMany({
      where: {
        clientId,
        archivedAt: null,
        sessionDate: { gte: new Date(from), lte: new Date(to) },
        ...closedSessionWhere,
        ...(boundaries.length ? { AND: boundaries } : {}),
        ...(routine ? { sourceTemplateId: routine.templateId, sourceTemplateVersion: routine.version } : {}),
      },
      include: sessionInclude,
      orderBy: [{ sessionDate: 'asc' }, { id: 'asc' }],
    });
  }

  async routine(
    context: AuthContext,
    assignmentId: string,
    requestedClientId?: string,
    timezoneOffset = 0,
  ): Promise<ProgressRoutineDetail> {
    const clientId = await this.repository.resolveProgressClient(context, requestedClientId);
    const state = await this.state(clientId);
    const routine = state.routines.find((item) => item.assignmentId === assignmentId);
    const assignment = state.assignments.find((item) => item.id === assignmentId);
    if (!routine || !assignment) throw new NotFoundException('Routine assignment not found');
    const today = key(new Date(Date.now() + timezoneOffset * 60_000));
    const end = routine.to && routine.to < today ? routine.to : today;
    const days = outline(assignment.revision.content);
    if (end < routine.from) return { routine, days, exercises: days.flatMap((day) => day.exercises), cycles: [] };
    const [sessions, events] = await Promise.all([
      this.sessions(clientId, routine.from, end, routine, state.assignments),
      this.prisma.calendarEvent.findMany({
        where: {
          clientId,
          archivedAt: null,
          type: 'workout',
          date: { gte: new Date(routine.from), lte: new Date(end) },
          planDay: { templateId: routine.templateId, revisionVersion: routine.version },
        },
        select: { id: true, clientId: true, date: true, originDate: true, planDayId: true },
      }),
    ]);
    const dailyRows = sessions.flatMap((session) => flattenSession(session, assignment.revision.content));
    const exerciseKeys = [...new Set(dailyRows.map((row) => `${row.exerciseType}:${row.exerciseId}`))];
    const audited = exerciseKeys.flatMap((exerciseKey) => {
      const rows = dailyRows.filter((row) => `${row.exerciseType}:${row.exerciseId}` === exerciseKey);
      return aggregateDailyExercise(rows[0]!.exerciseType, rows).flatMap((point) => point.audit);
    });
    const sessionMetrics = sessions.map((session): ProgressRoutineSession => {
      const data = audited.filter((row) => row.sessionId === session.id);
      const tonnage = sumPresent(data.map((row) => row.tonnage));
      const raw = record(session);
      const durationSeconds =
        nonnegative(raw.performedDurationSeconds) ??
        (session.startedAt && session.finishedAt
          ? Math.max(0, (session.finishedAt.getTime() - session.startedAt.getTime()) / 1000)
          : null);
      const rpe = numeric(session.sessionRpe);
      const inol = sumPresent(data.map((row) => row.inol));
      const heartRate = meanPresent(data.map((row) => row.heartRate));
      return {
        id: session.id,
        date: key(session.sessionDate),
        title: session.planDayTitle ?? 'Sesión',
        dayIndex: session.planDayIndex,
        incomplete: session.isIncomplete,
        tonnage,
        rpe,
        durationSeconds,
        trainingLoad: durationSeconds !== null && rpe !== null ? (durationSeconds / 60) * rpe : null,
        inol,
        effortIndex: inol !== null && rpe !== null && rpe > 0 ? inol / rpe : null,
        efficiency:
          durationSeconds !== null && heartRate !== null && heartRate > 0 ? (durationSeconds / 60 / heartRate) * 100 : null,
      };
    });
    const count = Math.floor((new Date(end).getTime() - new Date(routine.from).getTime()) / DAY / routine.cycleDays) + 1;
    const cycles = Array.from({ length: count }, (_, index) => {
      const from = key(new Date(new Date(routine.from).getTime() + index * routine.cycleDays * DAY));
      const to = key(new Date(new Date(from).getTime() + (routine.cycleDays - 1) * DAY));
      const rows = sessionMetrics.filter((session) => session.date >= from && session.date <= to);
      const summary = calculateWorkoutAdherence(events, sessions, from, to, today);
      return {
        index,
        from,
        to,
        sessions: rows,
        tonnage: sumPresent(rows.map((session) => session.tonnage)),
        avgRpe: meanPresent(rows.map((session) => session.rpe)),
        trainingLoad: sumPresent(rows.map((session) => session.trainingLoad)),
        adherence: { planned: summary.plannedCount, done: summary.counts.done, percent: summary.percent },
      };
    });
    const unique = new Map(
      days.flatMap((day) => day.exercises).map((exercise) => [`${exercise.exerciseType}:${exercise.exerciseId}`, exercise]),
    );
    return { routine, days, exercises: [...unique.values()], cycles: cycles.filter((cycle) => cycle.sessions.length > 0) };
  }

  async daily(context: AuthContext, query: DailyExerciseQuery): Promise<ProgressExerciseDaily> {
    const clientId = await this.repository.resolveProgressClient(context, query.clientId);
    const state = query.assignmentId ? await this.state(clientId) : undefined;
    const routine = state?.routines.find((item) => item.assignmentId === query.assignmentId);
    if (query.assignmentId && !routine) throw new NotFoundException('Routine assignment not found');
    const from = routine && routine.from > query.from ? routine.from : query.from;
    const to = routine?.to && routine.to < query.to ? routine.to : query.to;
    const sessions = from > to ? [] : await this.sessions(clientId, from, to, routine, state?.assignments);
    const revisions = sessions.length
      ? await this.prisma.routineRevision.findMany({
          where: {
            OR: [
              ...new Map(
                sessions.map((session) => [
                  `${session.sourceTemplateId}:${session.sourceTemplateVersion}`,
                  { templateId: session.sourceTemplateId, version: session.sourceTemplateVersion },
                ]),
              ).values(),
            ],
          },
          select: { templateId: true, version: true, content: true },
        })
      : [];
    const rows = sessions
      .flatMap((session) =>
        flattenSession(
          session,
          revisions.find(
            (revision) =>
              revision.templateId === session.sourceTemplateId && revision.version === session.sourceTemplateVersion,
          )?.content,
        ),
      )
      .filter((row) => row.exerciseType === query.exerciseType && row.exerciseId === query.exerciseId)
      .filter(
        (row) =>
          !routine ||
          !query.cycles?.length ||
          query.cycles.includes(
            Math.floor((new Date(row.sessionDate).getTime() - new Date(routine.from).getTime()) / DAY / routine.cycleDays),
          ),
      );
    const points = aggregateDailyExercise(query.exerciseType, rows);
    return {
      exercise: {
        exerciseId: query.exerciseId,
        exerciseType: query.exerciseType,
        name: rows[0]?.exerciseName ?? 'Ejercicio',
      },
      from: query.from,
      to: query.to,
      points,
      kpis: {
        sessionCount: points.reduce((count, point) => count + point.sessionCount, 0),
        recordE1rm: maxPresent(points.map((point) => point.e1rm)),
        maxWeightKg: maxPresent(points.map((point) => point.maxWeightKg)),
      },
    };
  }
}

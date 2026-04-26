/* eslint-disable max-lines -- progress repository aggregates many read paths */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  ExerciseProgressQuery,
  MicrocycleProgressQuery,
  PerformedExercisesQuery,
  PerformedSessionDaysQuery,
  PerformedTemplatesQuery,
  ProgressQuery,
  ProgressRepositoryPort,
  RecentSessionsQuery,
  SessionProgressQuery,
} from '../../domain/progress-repository.port';
import type {
  CardioLogRow,
  ExerciseProgressPoint,
  MicrocycleProgressPoint,
  MicrocycleProgressResult,
  PerformedExercisesResult,
  PerformedSessionDaysResult,
  PerformedTemplatesResult,
  RecentSessionSummary,
  SessionProgressPoint,
  SessionSrpeRow,
  StrengthLogRow,
} from '../../domain/progress.models';
import { aggregateExerciseSets } from '../../domain/metrics/exercise-metrics';
import {
  fetchPerformedExerciseNames,
  readCardioExerciseProgress,
  readIsometricProgress,
  readMobilityProgress,
  readPerformedIds,
  readPlioProgress,
  readSportProgress,
  type HeartProfile,
} from './progress-exercise-types.helpers';

@Injectable()
export class ProgressRepositoryPrisma implements ProgressRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async readCardioLogs(context: AuthContext, query: ProgressQuery): Promise<CardioLogRow[]> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const rows = await this.prisma.intervalLog.findMany({
      where: buildDateWhere(clientId, query),
      select: {
        avgHeartRate: true,
        distanceDoneMeters: true,
        durationSecondsDone: true,
        effortRpe: true,
        session: { select: { sessionDate: true } },
        sessionCardioBlock: { select: { sourceCardioMethodId: true } },
      },
    });
    const methodMap = await this.readMethodTypeMap(rows);
    return rows.map((row) => ({
      avgHeartRate: row.avgHeartRate,
      distanceDoneMeters: row.distanceDoneMeters,
      durationSecondsDone: row.durationSecondsDone,
      effortRpe: row.effortRpe,
      methodType: methodMap.get(row.sessionCardioBlock.sourceCardioMethodId ?? '') ?? 'UNKNOWN',
      sessionDate: row.session.sessionDate,
    }));
  }

  async readSessionSrpeRows(context: AuthContext, query: ProgressQuery): Promise<SessionSrpeRow[]> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const sessions = await this.prisma.sessionInstance.findMany({
      where: buildSessionWhere(clientId, query),
      select: {
        finishedAt: true,
        intervalLogs: { select: { durationSecondsDone: true, effortRpe: true } },
        logs: { select: { effortRpe: true } },
        sessionDate: true,
        startedAt: true,
      },
    });
    return sessions.map((session) => ({
      durationSeconds: readDurationSeconds(session.startedAt, session.finishedAt, session.intervalLogs),
      effortRpe: readSessionEffort(session.logs, session.intervalLogs),
      sessionDate: session.sessionDate,
    }));
  }

  async readStrengthLogs(context: AuthContext, query: ProgressQuery): Promise<StrengthLogRow[]> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const rows = await this.prisma.setLog.findMany({
      where: buildDateWhere(clientId, query),
      select: {
        repsDone: true,
        session: { select: { sessionDate: true } },
        sessionItem: { select: { sourceExerciseId: true } },
        weightDoneKg: true,
      },
    });
    const exerciseMap = await this.readMuscleGroupMap(rows);
    return rows.map((row) => ({
      muscleGroup: exerciseMap.get(row.sessionItem.sourceExerciseId ?? '') ?? 'UNKNOWN',
      repsDone: row.repsDone,
      sessionDate: row.session.sessionDate,
      weightDoneKg: row.weightDoneKg ? Number(row.weightDoneKg) : null,
    }));
  }

  // ── New detailed progress queries ─────────────────────────────────────────

  async readExerciseProgress(context: AuthContext, query: ExerciseProgressQuery): Promise<ExerciseProgressPoint[]> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const clientRow = await this.prisma.client.findFirst({
      where: { archivedAt: null, id: clientId },
      select: { fcMax: true, fcRest: true },
    });
    const heartProfile: HeartProfile = {
      fcMax: clientRow?.fcMax ?? null,
      fcRest: clientRow?.fcRest ?? null,
    };
    const type = query.exerciseType ?? 'strength';
    if (type === 'plio') return readPlioProgress(this.prisma, clientId, query);
    if (type === 'mobility') return readMobilityProgress(this.prisma, clientId, query);
    if (type === 'isometric') return readIsometricProgress(this.prisma, clientId, query);
    if (type === 'sport') return readSportProgress(this.prisma, clientId, query, heartProfile);
    if (type === 'cardio') return readCardioExerciseProgress(this.prisma, clientId, query, heartProfile);
    return this.readStrengthExerciseProgress(clientId, query);
  }

  private async readStrengthExerciseProgress(
    clientId: string,
    query: ExerciseProgressQuery,
  ): Promise<ExerciseProgressPoint[]> {
    const rows = await this.prisma.setLog.findMany({
      where: {
        sessionItem: {
          sourceExerciseId: query.exerciseId,
        },
        session: {
          archivedAt: null,
          clientId,
          isCompleted: true,
          sessionDate: { gte: query.from, lte: query.to },
        },
      },
      select: {
        setIndex: true,
        repsDone: true,
        weightDoneKg: true,
        effortRpe: true,
        sessionId: true,
        session: { select: { sessionDate: true } },
      },
      orderBy: [{ session: { sessionDate: 'asc' } }, { setIndex: 'asc' }],
    });

    const bySession = new Map<string, { sessionDate: Date; sets: typeof rows }>();
    for (const row of rows) {
      const entry = bySession.get(row.sessionId) ?? { sessionDate: row.session.sessionDate, sets: [] };
      entry.sets.push(row);
      bySession.set(row.sessionId, entry);
    }

    return [...bySession.entries()].map(([sessionId, { sessionDate, sets }]) =>
      aggregateExerciseSets(
        sessionId,
        sessionDate,
        sets.map((s) => ({
          setIndex: s.setIndex,
          repsDone: s.repsDone,
          weightDoneKg: s.weightDoneKg !== null ? Number(s.weightDoneKg) : null,
          effortRpe: s.effortRpe,
        })),
      ),
    );
  }

  async readPerformedExercises(context: AuthContext, query: PerformedExercisesQuery): Promise<PerformedExercisesResult> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const sessionWhere = {
      archivedAt: null as null,
      clientId,
      isCompleted: true,
      sessionDate: { gte: query.from, lte: query.to },
    };
    const ids = await readPerformedIds(this.prisma, sessionWhere);
    return fetchPerformedExerciseNames(this.prisma, ids);
  }

  async readPerformedTemplates(context: AuthContext, query: PerformedTemplatesQuery): Promise<PerformedTemplatesResult> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const sessions = await this.prisma.sessionInstance.findMany({
      where: {
        archivedAt: null,
        clientId,
        isCompleted: true,
        sessionDate: { gte: query.from, lte: query.to },
      },
      select: { sourceTemplateId: true },
      distinct: ['sourceTemplateId'],
    });

    const templateIds = sessions.map((s) => s.sourceTemplateId).filter((id): id is string => id !== null);
    if (templateIds.length === 0) return { templates: [] };

    const templates = await this.prisma.planTemplate.findMany({
      where: { id: { in: templateIds }, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return { templates: templates.map((t) => ({ id: t.id, name: t.name })) };
  }

  async readPerformedSessionDays(
    context: AuthContext,
    query: PerformedSessionDaysQuery,
  ): Promise<PerformedSessionDaysResult> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const rows = await this.prisma.sessionInstance.findMany({
      where: {
        archivedAt: null,
        clientId,
        isCompleted: true,
        sourceTemplateId: query.templateId,
        sessionDate: { gte: query.from, lte: query.to },
        planDayIndex: { not: null },
      },
      orderBy: { sessionDate: 'asc' },
      select: { planDayIndex: true, planDayTitle: true },
    });
    const snapshotTitleByIndex = new Map<number, string>();
    for (const r of rows) {
      if (r.planDayIndex == null) continue;
      if (!snapshotTitleByIndex.has(r.planDayIndex)) {
        const title = (r.planDayTitle?.trim() || `Day ${r.planDayIndex}`).slice(0, 120);
        snapshotTitleByIndex.set(r.planDayIndex, title);
      }
    }
    const indices = [...snapshotTitleByIndex.keys()].sort((a, b) => a - b);
    if (indices.length === 0) {
      return { days: [] };
    }
    const planDays = await this.prisma.planDay.findMany({
      where: {
        templateId: query.templateId,
        archivedAt: null,
        dayIndex: { in: indices },
      },
      select: { dayIndex: true, title: true },
    });
    const catalogTitleByIndex = new Map<number, string>(
      planDays.map((d) => [d.dayIndex, (d.title?.trim() || `Day ${d.dayIndex}`).slice(0, 120)]),
    );
    const days = indices.map((dayIndex) => ({
      dayIndex,
      title: catalogTitleByIndex.get(dayIndex) ?? snapshotTitleByIndex.get(dayIndex) ?? `Day ${dayIndex}`,
    }));
    return { days };
  }

  async readSessionProgress(context: AuthContext, query: SessionProgressQuery): Promise<SessionProgressPoint[]> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const legacy = query.dayIndex == null && query.category == null;
    const where: Prisma.SessionInstanceWhereInput = {
      archivedAt: null,
      clientId,
      isCompleted: true,
      sourceTemplateId: query.templateId,
      sessionDate: { gte: query.from, lte: query.to },
    };
    if (!legacy && query.dayIndex != null) {
      where.planDayIndex = query.dayIndex;
    }

    const sessions = await this.prisma.sessionInstance.findMany({
      where,
      select: sessionProgressSelect(),
      orderBy: { sessionDate: 'asc' },
    });

    if (legacy) {
      return sessions.map(mapLegacySessionProgressPoint);
    }
    const category = query.category ?? 'strength';
    return sessions.map((s) => mapCategorySessionProgressPoint(s, category));
  }

  async readMicrocycleProgress(context: AuthContext, query: MicrocycleProgressQuery): Promise<MicrocycleProgressResult> {
    const clientId = await this.resolveClientId(context, query.clientId);
    let cycleDays = 7;
    if (query.templateId) {
      const tpl = await this.prisma.planTemplate.findFirst({
        where: { id: query.templateId, archivedAt: null },
        select: { expectedCompletionDays: true },
      });
      const n = tpl?.expectedCompletionDays;
      cycleDays = typeof n === 'number' && n >= 1 && n <= 90 ? n : 7;
    }

    const where: Prisma.SessionInstanceWhereInput = {
      archivedAt: null,
      clientId,
      isCompleted: true,
      sessionDate: { gte: query.from, lte: query.to },
    };
    if (query.templateId) {
      where.sourceTemplateId = query.templateId;
    }

    const sessions = await this.prisma.sessionInstance.findMany({
      where,
      select: sessionProgressSelect(),
      orderBy: { sessionDate: 'asc' },
    });

    const legacy = !query.category;
    const sessionPoints = sessions.map((row) =>
      legacy ? mapLegacySessionProgressPoint(row) : mapCategorySessionProgressPoint(row, query.category!),
    );

    const fromYmd = query.from.toISOString().slice(0, 10);
    type Acc = MicrocycleProgressPoint & { _rpeSum: number; _rpeCount: number };
    const byBlock = new Map<string, Acc>();
    for (const point of sessionPoints) {
      const blockStart = microcycleBlockStartIso(point.sessionDate, fromYmd, cycleDays);
      const current: Acc = byBlock.get(blockStart) ?? {
        weekStart: blockStart,
        totalTonnage: 0,
        avgRpe: null,
        totalTrainingLoad: null,
        sessionsCount: 0,
        _rpeSum: 0,
        _rpeCount: 0,
      };
      current._rpeSum = (current._rpeSum ?? 0) + (point.sessionRpe ?? 0);
      current._rpeCount = (current._rpeCount ?? 0) + (point.sessionRpe !== null ? 1 : 0);
      current.totalTonnage = Math.round((current.totalTonnage + point.sessionTonnage) * 100) / 100;
      current.totalTrainingLoad = (current.totalTrainingLoad ?? 0) + (point.trainingLoad ?? 0);
      current.sessionsCount++;
      current.avgRpe = current._rpeCount > 0 ? Math.round((current._rpeSum / current._rpeCount) * 100) / 100 : null;
      byBlock.set(blockStart, current);
    }

    const points = [...byBlock.values()]
      .map(({ weekStart, totalTonnage, avgRpe, totalTrainingLoad, sessionsCount }) => ({
        weekStart,
        totalTonnage,
        avgRpe,
        totalTrainingLoad: totalTrainingLoad !== null ? Math.round(totalTrainingLoad * 100) / 100 : null,
        sessionsCount,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    return { cycleDays, points };
  }

  async readRecentSessions(context: AuthContext, query: RecentSessionsQuery): Promise<RecentSessionSummary[]> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const whereBase: Prisma.SessionInstanceWhereInput = {
      archivedAt: null,
      clientId,
      isCompleted: true,
      sessionDate: { gte: query.from, lte: query.to },
      ...(query.templateId ? { sourceTemplateId: query.templateId } : {}),
    };

    const sessions = await this.prisma.sessionInstance.findMany({
      where: whereBase,
      select: {
        id: true,
        sessionDate: true,
        startedAt: true,
        finishedAt: true,
        items: {
          where: { archivedAt: null },
          select: {
            id: true,
            sourceExerciseId: true,
            logs: {
              select: { repsDone: true, weightDoneKg: true, effortRpe: true },
            },
          },
        },
      },
      orderBy: { sessionDate: 'desc' },
      take: query.limit,
    });

    return sessions
      .filter((session) => {
        if (!query.exerciseId) return true;
        return session.items.some((item) => item.sourceExerciseId === query.exerciseId);
      })
      .map((session) => {
        let totalTonnage = 0;
        let totalInol = 0;
        let totalRpe = 0;
        let rpeCount = 0;
        let inolCount = 0;

        for (const item of session.items) {
          for (const log of item.logs) {
            const w = log.weightDoneKg !== null ? Number(log.weightDoneKg) : null;
            const r = log.repsDone;
            if (w !== null && r !== null) {
              totalTonnage += w * r;
              totalInol += r / 25;
              inolCount++;
            }
            if (log.effortRpe !== null) {
              totalRpe += log.effortRpe;
              rpeCount++;
            }
          }
        }

        const durationMs =
          session.startedAt && session.finishedAt ? session.finishedAt.getTime() - session.startedAt.getTime() : null;

        return {
          sessionDate: session.sessionDate.toISOString().slice(0, 10),
          sessionId: session.id,
          exerciseCount: session.items.length,
          totalTonnage: Math.round(totalTonnage * 100) / 100,
          sessionInol: inolCount > 0 ? Math.round(totalInol * 10000) / 10000 : null,
          avgRpe: rpeCount > 0 ? Math.round((totalRpe / rpeCount) * 100) / 100 : null,
          durationMinutes: durationMs !== null ? Math.round(durationMs / 60000) : null,
        };
      });
  }

  // ── Existing private helpers ───────────────────────────────────────────────

  private async readMethodTypeMap(
    rows: Array<{ sessionCardioBlock: { sourceCardioMethodId: null | string } }>,
  ): Promise<Map<string, string>> {
    const ids = uniqueIds(rows.map((row) => row.sessionCardioBlock.sourceCardioMethodId));
    if (ids.length === 0) {
      return new Map();
    }
    const methods = await this.prisma.cardioMethod.findMany({
      where: { id: { in: ids } },
      select: { id: true, methodTypeRef: { select: { label: true } } },
    });
    return new Map(methods.map((row) => [row.id, row.methodTypeRef.label]));
  }

  private async readMuscleGroupMap(
    rows: Array<{ sessionItem: { sourceExerciseId: null | string } }>,
  ): Promise<Map<string, string>> {
    const ids = uniqueIds(rows.map((row) => row.sessionItem.sourceExerciseId));
    if (ids.length === 0) {
      return new Map();
    }
    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: ids } },
      select: { id: true, muscleGroups: { include: { muscleGroup: { select: { label: true } } } } },
    });
    return new Map(exercises.map((row) => [row.id, row.muscleGroups.map((mg) => mg.muscleGroup.label).join(', ')]));
  }

  private async resolveClientId(context: AuthContext, inputClientId?: string): Promise<string> {
    if (context.activeRole === 'coach') {
      if (!inputClientId) {
        throw new ForbiddenException('clientId is required for coach progress queries');
      }
      const membership = await this.readCoachMembership(context.subject);
      await this.assertCoachClient(membership.id, inputClientId);
      return inputClientId;
    }
    if (context.activeRole === 'client') {
      return this.readClientIdByEmail(context.email ?? '', inputClientId);
    }
    throw new ForbiddenException('Admin cannot access client progress');
  }

  private async readCoachMembership(subject: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: subject } },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException('Coach membership not found');
    }
    return membership;
  }

  private async assertCoachClient(coachMembershipId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, coachMembershipId, id: clientId },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException('Client not found for current coach');
    }
  }

  private async readClientIdByEmail(email: string, inputClientId?: string): Promise<string> {
    if (!email) {
      throw new ForbiddenException('Client email not found in auth context');
    }
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, email },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    if (inputClientId && inputClientId !== client.id) {
      throw new ForbiddenException('Client cannot read progress from another profile');
    }
    return client.id;
  }
}

function utcCalendarDaysBetween(fromIsoYmd: string, toIsoYmd: string): number {
  const t0 = Date.UTC(+fromIsoYmd.slice(0, 4), +fromIsoYmd.slice(5, 7) - 1, +fromIsoYmd.slice(8, 10));
  const t1 = Date.UTC(+toIsoYmd.slice(0, 4), +toIsoYmd.slice(5, 7) - 1, +toIsoYmd.slice(8, 10));
  return Math.floor((t1 - t0) / 86400000);
}

/** Start date (YYYY-MM-DD) of the N-day microcycle block containing sessionDateYmd, anchored at rangeFromYmd. */
function microcycleBlockStartIso(sessionDateYmd: string, rangeFromYmd: string, cycleDays: number): string {
  const n = Math.max(1, cycleDays);
  const diff = utcCalendarDaysBetween(rangeFromYmd, sessionDateYmd);
  const k = Math.floor(Math.max(0, diff) / n);
  const base = new Date(`${rangeFromYmd}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + k * n);
  return base.toISOString().slice(0, 10);
}

type SessionProgressRow = {
  id: string;
  sessionDate: Date;
  client: { fcRest: number | null; fcMax: number | null } | null;
  logs: Array<{ repsDone: number | null; weightDoneKg: Prisma.Decimal | null; effortRpe: number | null }>;
  intervalLogs: Array<{ durationSecondsDone: number | null; effortRpe: number | null; avgHeartRate: number | null }>;
  plioLogs: Array<{ repsDone: number | null; weightDoneKg: Prisma.Decimal | null; effortRpe: number | null }>;
  mobilityLogs: Array<{ effortRpe: number | null }>;
  isometricLogs: Array<{
    durationSecondsDone: number | null;
    weightDoneKg: Prisma.Decimal | null;
    effortRpe: number | null;
  }>;
  sportLogs: Array<{ durationMinutesDone: number | null; effortRpe: number | null; avgHeartRate: number | null }>;
};

function sessionProgressSelect() {
  return {
    id: true,
    sessionDate: true,
    client: { select: { fcRest: true, fcMax: true } },
    logs: { select: { repsDone: true, weightDoneKg: true, effortRpe: true } },
    intervalLogs: { select: { durationSecondsDone: true, effortRpe: true, avgHeartRate: true } },
    plioLogs: { select: { repsDone: true, weightDoneKg: true, effortRpe: true } },
    mobilityLogs: { select: { effortRpe: true } },
    isometricLogs: { select: { durationSecondsDone: true, weightDoneKg: true, effortRpe: true } },
    sportLogs: { select: { durationMinutesDone: true, effortRpe: true, avgHeartRate: true } },
  };
}

function aggregateStrengthSetLogs(logs: SessionProgressRow['logs']): {
  totalTonnage: number;
  sessionInol: number | null;
  avgRpe: number | null;
  effortIndex: number | null;
} {
  let totalTonnage = 0;
  let totalInol = 0;
  let inolCount = 0;
  let totalRpe = 0;
  let rpeCount = 0;
  for (const log of logs) {
    const w = log.weightDoneKg !== null ? Number(log.weightDoneKg) : null;
    const r = log.repsDone;
    if (w !== null && r !== null) {
      totalTonnage += w * r;
      totalInol += r / 25;
      inolCount++;
    }
    if (log.effortRpe !== null) {
      totalRpe += log.effortRpe;
      rpeCount++;
    }
  }
  const avgRpe = rpeCount > 0 ? Math.round((totalRpe / rpeCount) * 100) / 100 : null;
  const sessionInol = inolCount > 0 ? Math.round(totalInol * 10000) / 10000 : null;
  const effortIndex = avgRpe !== null && sessionInol !== null ? Math.round(avgRpe * sessionInol * 100) / 100 : null;
  return {
    totalTonnage: Math.round(totalTonnage * 100) / 100,
    sessionInol,
    avgRpe,
    effortIndex,
  };
}

function cardioTrainingFromIntervals(session: SessionProgressRow): {
  trainingLoad: number | null;
  avgRpe: number | null;
  avgHr: number | null;
  intervalDurationSeconds: number;
} {
  const intervalDurationSeconds = session.intervalLogs.reduce((sum, l) => sum + (l.durationSecondsDone ?? 0), 0);
  const durationMinutes = intervalDurationSeconds > 0 ? intervalDurationSeconds / 60 : null;
  const hrRows = session.intervalLogs.filter((l) => l.avgHeartRate !== null);
  const avgHr = hrRows.length > 0 ? Math.round(hrRows.reduce((s, l) => s + (l.avgHeartRate ?? 0), 0) / hrRows.length) : null;
  const rpeRows = session.intervalLogs.filter((l) => l.effortRpe !== null);
  const avgRpe =
    rpeRows.length > 0
      ? Math.round((rpeRows.reduce((s, l) => s + (l.effortRpe ?? 0), 0) / rpeRows.length) * 100) / 100
      : null;
  let trainingLoad: number | null = null;
  if (durationMinutes !== null && avgHr !== null) {
    const fcRest = session.client?.fcRest ?? 60;
    const fcMax = session.client?.fcMax ?? 190;
    const denom = fcMax - fcRest;
    const fcReservePercent = denom > 0 ? ((avgHr - fcRest) / denom) * 100 : 0;
    trainingLoad = Math.round(durationMinutes * Math.max(0, fcReservePercent) * 100) / 100;
  }
  return { trainingLoad, avgRpe, avgHr, intervalDurationSeconds };
}

function mapLegacySessionProgressPoint(session: SessionProgressRow): SessionProgressPoint {
  const s = aggregateStrengthSetLogs(session.logs);
  const cardio = cardioTrainingFromIntervals(session);
  const sessionEfficiency =
    cardio.avgHr !== null && cardio.avgHr > 0 && s.totalTonnage > 0
      ? Math.round((s.totalTonnage / cardio.avgHr) * 100) / 100
      : null;
  return {
    sessionDate: session.sessionDate.toISOString().slice(0, 10),
    sessionId: session.id,
    sessionTonnage: s.totalTonnage,
    sessionInol: s.sessionInol,
    sessionRpe: s.avgRpe,
    effortIndex: s.effortIndex,
    trainingLoad: cardio.trainingLoad,
    sessionEfficiency,
  };
}

function mapCategorySessionProgressPoint(session: SessionProgressRow, category: string): SessionProgressPoint {
  switch (category) {
    case 'strength':
      return mapCategorySessionStrength(session);
    case 'cardio':
      return mapCategorySessionCardio(session);
    case 'plio':
      return mapCategorySessionPlio(session);
    case 'isometric':
      return mapCategorySessionIsometric(session);
    case 'mobility':
      return mapCategorySessionMobility(session);
    case 'sport':
      return mapCategorySessionSport(session);
    default:
      return mapCategorySessionStrength(session);
  }
}

function mapCategorySessionBase(session: SessionProgressRow) {
  return { sessionDate: session.sessionDate.toISOString().slice(0, 10), sessionId: session.id };
}

function mapCategorySessionStrength(session: SessionProgressRow): SessionProgressPoint {
  const baseDate = mapCategorySessionBase(session);
  const s = aggregateStrengthSetLogs(session.logs);
  return {
    ...baseDate,
    sessionTonnage: s.totalTonnage,
    sessionInol: s.sessionInol,
    sessionRpe: s.avgRpe,
    effortIndex: s.effortIndex,
    trainingLoad: null,
    sessionEfficiency: null,
  };
}

function mapCategorySessionCardio(session: SessionProgressRow): SessionProgressPoint {
  const baseDate = mapCategorySessionBase(session);
  const c = cardioTrainingFromIntervals(session);
  const sessionEfficiency =
    c.avgHr !== null && c.avgHr > 0 && c.intervalDurationSeconds > 0
      ? Math.round((c.intervalDurationSeconds / c.avgHr) * 100) / 100
      : null;
  return {
    ...baseDate,
    sessionTonnage: 0,
    sessionInol: null,
    sessionRpe: c.avgRpe,
    effortIndex: null,
    trainingLoad: c.trainingLoad,
    sessionEfficiency,
  };
}

function mapCategorySessionPlio(session: SessionProgressRow): SessionProgressPoint {
  const baseDate = mapCategorySessionBase(session);
  let ton = 0;
  let rpeSum = 0;
  let rpeN = 0;
  for (const log of session.plioLogs) {
    const w = log.weightDoneKg !== null ? Number(log.weightDoneKg) : 0;
    const r = log.repsDone ?? 0;
    ton += w * r;
    if (log.effortRpe !== null) {
      rpeSum += log.effortRpe;
      rpeN++;
    }
  }
  const avgRpe = rpeN > 0 ? Math.round((rpeSum / rpeN) * 100) / 100 : null;
  return {
    ...baseDate,
    sessionTonnage: Math.round(ton * 100) / 100,
    sessionInol: null,
    sessionRpe: avgRpe,
    effortIndex: null,
    trainingLoad: null,
    sessionEfficiency: null,
  };
}

function mapCategorySessionIsometric(session: SessionProgressRow): SessionProgressPoint {
  const baseDate = mapCategorySessionBase(session);
  let ton = 0;
  let rpeSum = 0;
  let rpeN = 0;
  for (const log of session.isometricLogs) {
    const w = log.weightDoneKg !== null ? Number(log.weightDoneKg) : 0;
    const sec = log.durationSecondsDone ?? 0;
    ton += w * (sec / 60);
    if (log.effortRpe !== null) {
      rpeSum += log.effortRpe;
      rpeN++;
    }
  }
  const avgRpe = rpeN > 0 ? Math.round((rpeSum / rpeN) * 100) / 100 : null;
  return {
    ...baseDate,
    sessionTonnage: Math.round(ton * 100) / 100,
    sessionInol: null,
    sessionRpe: avgRpe,
    effortIndex: null,
    trainingLoad: null,
    sessionEfficiency: null,
  };
}

function mapCategorySessionMobility(session: SessionProgressRow): SessionProgressPoint {
  const baseDate = mapCategorySessionBase(session);
  const rpeVals = session.mobilityLogs.map((l) => l.effortRpe).filter((v): v is number => v !== null);
  const avgRpe = rpeVals.length > 0 ? Math.round((rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length) * 100) / 100 : null;
  return {
    ...baseDate,
    sessionTonnage: 0,
    sessionInol: null,
    sessionRpe: avgRpe,
    effortIndex: null,
    trainingLoad: null,
    sessionEfficiency: null,
  };
}

function mapCategorySessionSport(session: SessionProgressRow): SessionProgressPoint {
  const baseDate = mapCategorySessionBase(session);
  let abstractTonnage = 0;
  let inolAcc = 0;
  let rpeSum = 0;
  let rpeN = 0;
  let hrWeighted = 0;
  let durWeighted = 0;
  for (const log of session.sportLogs) {
    const dm = log.durationMinutesDone ?? 0;
    const rpe = log.effortRpe ?? 0;
    abstractTonnage += dm * Math.max(1, rpe);
    inolAcc += (dm * rpe) / 10;
    if (log.effortRpe !== null) {
      rpeSum += log.effortRpe;
      rpeN++;
    }
    if (log.avgHeartRate !== null && dm > 0) {
      hrWeighted += log.avgHeartRate * dm;
      durWeighted += dm;
    }
  }
  const avgRpe = rpeN > 0 ? Math.round((rpeSum / rpeN) * 100) / 100 : null;
  const sessionInol = inolAcc > 0 ? Math.round(inolAcc * 100) / 100 : null;
  const effortIndex = avgRpe !== null && sessionInol !== null ? Math.round(avgRpe * sessionInol * 100) / 100 : null;
  const avgHr = durWeighted > 0 ? Math.round(hrWeighted / durWeighted) : null;
  const sessionEfficiency = avgHr !== null && abstractTonnage > 0 ? Math.round((abstractTonnage / avgHr) * 100) / 100 : null;
  return {
    ...baseDate,
    sessionTonnage: Math.round(abstractTonnage * 100) / 100,
    sessionInol,
    sessionRpe: avgRpe,
    effortIndex,
    trainingLoad: null,
    sessionEfficiency,
  };
}

function buildDateWhere(clientId: string, query: ProgressQuery) {
  return {
    session: {
      archivedAt: null,
      clientId,
      isCompleted: true,
      sessionDate: { gte: query.from, lte: query.to },
    },
  };
}

function buildSessionWhere(clientId: string, query: ProgressQuery) {
  return {
    archivedAt: null,
    clientId,
    isCompleted: true,
    sessionDate: { gte: query.from, lte: query.to },
  };
}

function uniqueIds(items: Array<null | string>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item)))];
}

function readDurationSeconds(
  startedAt: Date | null,
  finishedAt: Date | null,
  intervalLogs: Array<{ durationSecondsDone: null | number }>,
): null | number {
  if (startedAt && finishedAt && finishedAt > startedAt) {
    return Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
  }
  const intervalDuration = intervalLogs.reduce((sum, row) => sum + (row.durationSecondsDone ?? 0), 0);
  return intervalDuration > 0 ? intervalDuration : null;
}

function readSessionEffort(
  setLogs: Array<{ effortRpe: null | number }>,
  intervalLogs: Array<{ effortRpe: null | number }>,
): null | number {
  const values = [...setLogs, ...intervalLogs]
    .map((row) => row.effortRpe)
    .filter((value): value is number => value !== null);
  if (values.length === 0) {
    return null;
  }
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(avg * 100) / 100;
}

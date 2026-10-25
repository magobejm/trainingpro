import { selectRecordedSportRecords, sportRecordsSelect } from './sport-progress-records';
/* eslint-disable max-lines -- progress repository aggregates many read paths */
import { readSessionOrigins } from '../../../../common/plan/session-origins.prisma';
import { closeStaleSessions } from '../../../sessions/infra/prisma/session-stale';
import { sessionOutcome } from '@trainerpro/shared';
import { closedSessionWhere, outcomeSelect } from './closed-session';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { toRpeNumber } from '../../../../common/plan/rpe-number';
import {
  isRecordedNumber,
  isRecordedNonNegative,
  strengthSetHasData,
  plioSetHasData,
  isometricSetHasData,
  mobilitySetHasData,
  cardioIntervalHasData,
  sportSetHasData,
  sportLogHasData,
} from '../../../../common/performed-set';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  ExercisePrQuery,
  ExerciseProgressQuery,
  MicrocycleProgressQuery,
  PerformedExercisesQuery,
  PerformedSessionDaysQuery,
  PerformedTemplatesQuery,
  PersonalRecord,
  PersonalRecordsQuery,
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
import { aggregateExerciseSets, estimateE1rm, calculateSetInol } from '../../domain/metrics/exercise-metrics';
import { collectBrokenRecords } from '../../domain/prior-records';
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

  async resolveProgressClient(context: AuthContext, clientId?: string): Promise<string> {
    return this.resolveClientId(context, clientId);
  }

  async readCardioLogs(context: AuthContext, query: ProgressQuery, resolvedClientId?: string): Promise<CardioLogRow[]> {
    const clientId = resolvedClientId ?? (await this.resolveClientId(context, query.clientId));
    const rows = await this.prisma.intervalLog.findMany({
      where: buildDateWhere(clientId, query),
      select: {
        avgHeartRate: true,
        distanceDoneMeters: true,
        durationSecondsDone: true,
        effortRpe: true,
        session: { select: { sessionDate: true, ...outcomeSelect } },
        sessionCardioBlock: { select: { sourceCardioMethodId: true } },
      },
    });
    const methodMap = await this.readMethodTypeMap(rows);
    return rows.map((row) => ({
      avgHeartRate: row.avgHeartRate,
      distanceDoneMeters: row.distanceDoneMeters,
      durationSecondsDone: row.durationSecondsDone,
      effortRpe: toRpeNumber(row.effortRpe),
      methodType: methodMap.get(row.sessionCardioBlock.sourceCardioMethodId ?? '') ?? 'UNKNOWN',
      sessionDate: row.session.sessionDate,
    }));
  }

  async readSessionSrpeRows(
    context: AuthContext,
    query: ProgressQuery,
    resolvedClientId?: string,
  ): Promise<SessionSrpeRow[]> {
    const clientId = resolvedClientId ?? (await this.resolveClientId(context, query.clientId));
    const sessions = await this.prisma.sessionInstance.findMany({
      where: buildSessionWhere(clientId, query),
      select: {
        finishedAt: true,
        intervalLogs: { select: { durationSecondsDone: true, effortRpe: true } },
        logs: { select: { effortRpe: true } },
        plioLogs: { select: { effortRpe: true } },
        mobilityLogs: { select: { effortRpe: true } },
        isometricLogs: { select: { effortRpe: true } },
        ...sportRecordsSelect,
        sessionDate: true,
        startedAt: true,
      },
    });
    return sessions.map((session) => ({
      durationSeconds: readDurationSeconds(session.startedAt, session.finishedAt, session.intervalLogs),
      effortRpe: readSessionEffort(
        [
          ...session.logs,
          ...session.plioLogs,
          ...session.mobilityLogs,
          ...session.isometricLogs,
          ...selectRecordedSportRecords(session.sportSetLogs, session.sportLogs).sets,
          ...selectRecordedSportRecords(session.sportSetLogs, session.sportLogs).legacy,
        ],
        session.intervalLogs,
      ),
      sessionDate: session.sessionDate,
    }));
  }

  async readStrengthLogs(context: AuthContext, query: ProgressQuery, resolvedClientId?: string): Promise<StrengthLogRow[]> {
    const clientId = resolvedClientId ?? (await this.resolveClientId(context, query.clientId));
    const rows = await this.prisma.setLog.findMany({
      where: buildDateWhere(clientId, query),
      select: {
        repsDone: true,
        session: { select: { sessionDate: true, ...outcomeSelect } },
        sessionItem: { select: { sourceExerciseId: true } },
        weightDoneKg: true,
      },
    });
    const exerciseMap = await this.readMuscleGroupMap(rows);
    return rows.map((row) => ({
      muscleGroup: exerciseMap.get(row.sessionItem.sourceExerciseId ?? '') ?? 'UNKNOWN',
      repsDone: row.repsDone,
      sessionDate: row.session.sessionDate,
      weightDoneKg: row.weightDoneKg !== null ? Number(row.weightDoneKg) : null,
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

  async readExercisePr(context: AuthContext, query: ExercisePrQuery): Promise<number | null> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const rows = await this.prisma.$queryRaw<Array<{ weight: number | null }>>`
      SELECT l.weight_done_kg::float8 AS weight
      FROM session_instance s
      JOIN session_strength_item i ON i.session_id = s.id
      JOIN set_log l ON l.session_item_id = i.id
      WHERE s.client_id = ${clientId}::uuid
        AND s.archived_at IS NULL
        AND (s.is_incomplete = true OR s.is_completed = true OR s.status = 'COMPLETED')
        AND i.source_exercise_id = ${query.exerciseId}::uuid
      ORDER BY l.weight_done_kg DESC
      LIMIT 1
    `;
    const weight = rows[0]?.weight;
    return weight === null || weight === undefined ? null : Number(weight);
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
          ...closedSessionWhere,
          sessionDate: { gte: query.from, lte: query.to },
        },
      },
      select: {
        setIndex: true,
        repsDone: true,
        weightDoneKg: true,
        effortRpe: true,
        effortRir: true,
        sessionId: true,
        session: { select: { sessionDate: true, ...outcomeSelect } },
      },
      orderBy: [{ session: { sessionDate: 'asc' } }, { setIndex: 'asc' }],
    });

    const bySession = new Map<string, { sessionDate: Date; sets: typeof rows }>();
    for (const row of rows) {
      const entry = bySession.get(row.sessionId) ?? { sessionDate: row.session.sessionDate, sets: [] };
      entry.sets.push(row);
      bySession.set(row.sessionId, entry);
    }

    return [...bySession.entries()].flatMap(([sessionId, { sessionDate, sets }]) => {
      const point = aggregateExerciseSets(
        sessionId,
        sessionDate,
        sets.map((s) => ({
          setIndex: s.setIndex,
          repsDone: s.repsDone,
          weightDoneKg: s.weightDoneKg !== null ? Number(s.weightDoneKg) : null,
          effortRpe: toRpeNumber(s.effortRpe),
          effortRir: s.effortRir,
        })),
      );
      return point.sets > 0 ? [{ ...point, outcome: sessionOutcome(sets[0]!.session), hasRecordedData: true }] : [];
    });
  }

  async readPerformedExercises(context: AuthContext, query: PerformedExercisesQuery): Promise<PerformedExercisesResult> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const sessionWhere = {
      archivedAt: null as null,
      clientId,
      ...closedSessionWhere,
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
        ...closedSessionWhere,
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
        ...closedSessionWhere,
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
      ...closedSessionWhere,
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

    const origins = await readSessionOrigins(this.prisma, sessions);
    const category = query.category ?? 'strength';
    return sessions.map((session) => ({
      ...(legacy ? mapLegacySessionProgressPoint(session) : mapCategorySessionProgressPoint(session, category)),
      originDate: origins.get(session.id) ?? null,
    }));
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
      ...closedSessionWhere,
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

    const recordsBrokenBySession = await this.readRecordsBrokenBySession(clientId, query);

    const legacy = !query.category;

    const fromYmd = query.from.toISOString().slice(0, 10);
    type Acc = MicrocycleProgressPoint & { _rpeSum: number; _rpeCount: number; _e1rmSum: number; _e1rmCount: number };
    const byBlock = new Map<string, Acc>();
    for (const session of sessions) {
      const point = legacy
        ? mapLegacySessionProgressPoint(session)
        : mapCategorySessionProgressPoint(session, query.category!);
      const blockStart = microcycleBlockStartIso(point.sessionDate, fromYmd, cycleDays);
      const e1rmLogs =
        legacy || query.category === 'strength'
          ? session.logs
          : query.category === 'plio'
            ? session.plioLogs
            : query.category === 'sport'
              ? (session.sportSetLogs ?? [])
              : [];
      const e1rmStats = strengthE1rmStatsFromLogs(e1rmLogs);
      const current: Acc = byBlock.get(blockStart) ?? {
        weekStart: blockStart,
        totalTonnage: null,
        avgRpe: null,
        totalTrainingLoad: null,
        sessionsCount: 0,
        avgE1rm: null,
        recordsBroken: 0,
        metricCoverage: {},
        _rpeSum: 0,
        _rpeCount: 0,
        _e1rmSum: 0,
        _e1rmCount: 0,
      };
      current._rpeSum = (current._rpeSum ?? 0) + (point.sessionRpe ?? 0);
      current._rpeCount = (current._rpeCount ?? 0) + (point.sessionRpe !== null ? 1 : 0);
      if (point.sessionTonnage !== null)
        current.totalTonnage = Math.round(((current.totalTonnage ?? 0) + point.sessionTonnage) * 100) / 100;
      if (point.trainingLoad !== null) current.totalTrainingLoad = (current.totalTrainingLoad ?? 0) + point.trainingLoad;
      for (const [key, value] of Object.entries({
        totalTonnage: point.sessionTonnage,
        avgRpe: point.sessionRpe,
        totalTrainingLoad: point.trainingLoad,
        avgE1rm: e1rmStats.count ? e1rmStats.sum / e1rmStats.count : null,
      })) {
        const coverage = current.metricCoverage![key] ?? { validSamples: 0, eligibleSamples: 0, unit: 'sessions' as const };
        coverage.eligibleSamples++;
        if (value !== null) coverage.validSamples++;
        current.metricCoverage![key] = coverage;
      }
      current.metricCoverage!.avgE1rm = {
        validSamples: current._e1rmCount + e1rmStats.count,
        eligibleSamples: (current.metricCoverage!.avgE1rm?.eligibleSamples ?? 0) - 1 + e1rmLogs.length,
        unit: 'sets',
      };
      current._e1rmSum += e1rmStats.sum;
      current._e1rmCount += e1rmStats.count;
      current.sessionsCount++;
      current.recordsBroken += recordsBrokenBySession.get(point.sessionId) ?? 0;
      current.avgRpe = current._rpeCount > 0 ? Math.round((current._rpeSum / current._rpeCount) * 100) / 100 : null;
      current.avgE1rm = current._e1rmCount > 0 ? Math.round((current._e1rmSum / current._e1rmCount) * 100) / 100 : null;
      byBlock.set(blockStart, current);
    }

    const points = [...byBlock.values()]
      .map(
        ({ weekStart, totalTonnage, avgRpe, totalTrainingLoad, sessionsCount, avgE1rm, recordsBroken, metricCoverage }) => ({
          metricCoverage,
          weekStart,
          totalTonnage,
          avgRpe,
          totalTrainingLoad: totalTrainingLoad !== null ? Math.round(totalTrainingLoad * 100) / 100 : null,
          sessionsCount,
          avgE1rm,
          recordsBroken,
        }),
      )
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    return { cycleDays, points };
  }

  private async readRecordsBrokenBySession(clientId: string, query: MicrocycleProgressQuery): Promise<Map<string, number>> {
    const priorRows = await this.prisma.$queryRaw<Array<{ best_e1rm: number; exercise_id: string }>>`
      SELECT i.source_exercise_id AS exercise_id,
             MAX(
               CASE
                 WHEN l.weight_done_kg > 0 AND l.reps_done > 0 AND (l.effort_rir IS NOT NULL OR l.effort_rpe IS NOT NULL)
                  AND (1.0278 - 0.0278 * (
                    l.reps_done + COALESCE(l.effort_rir, GREATEST(0, 10 - l.effort_rpe))
                  )) > 0
                 THEN ROUND((
                   l.weight_done_kg / (1.0278 - 0.0278 * (
                     l.reps_done + COALESCE(l.effort_rir, GREATEST(0, 10 - l.effort_rpe))
                   ))
                 )::numeric, 2)
                 ELSE NULL
               END
             )::float8 AS best_e1rm
      FROM set_log l
      JOIN session_strength_item i ON i.id = l.session_item_id
      JOIN session_instance s ON s.id = l.session_id
      WHERE s.client_id = ${clientId}::uuid
        AND s.archived_at IS NULL
        AND (s.is_incomplete = true OR s.is_completed = true OR s.status = 'COMPLETED')
        AND s.session_date < ${query.from}::date
        AND i.source_exercise_id IS NOT NULL
      GROUP BY i.source_exercise_id
    `;
    const priorBestByExercise = new Map<string, number>();
    for (const row of priorRows) {
      if (row.best_e1rm !== null) priorBestByExercise.set(row.exercise_id, Number(row.best_e1rm));
    }

    const where: Prisma.SetLogWhereInput = {
      session: {
        archivedAt: null,
        clientId,
        ...closedSessionWhere,
        sessionDate: { gte: query.from, lte: query.to },
      },
    };
    if (query.templateId) {
      where.session = {
        ...(where.session as Prisma.SessionInstanceWhereInput),
        sourceTemplateId: query.templateId,
      };
    }
    const logsInRange = await this.prisma.setLog.findMany({
      where,
      select: {
        setIndex: true,
        sessionId: true,
        repsDone: true,
        weightDoneKg: true,
        effortRpe: true,
        effortRir: true,
        session: { select: { sessionDate: true, ...outcomeSelect } },
        sessionItem: { select: { sourceExerciseId: true } },
      },
      orderBy: [{ session: { sessionDate: 'asc' } }, { sessionId: 'asc' }, { setIndex: 'asc' }],
    });

    const records = collectBrokenRecords(
      priorBestByExercise,
      logsInRange.map((log) => ({
        effortRpe: toRpeNumber(log.effortRpe),
        effortRir: log.effortRir,
        exerciseId: log.sessionItem?.sourceExerciseId ?? null,
        exerciseName: '',
        repsDone: log.repsDone,
        sessionDate: log.session.sessionDate.toISOString().slice(0, 10),
        sessionId: log.sessionId,
        weightDoneKg: log.weightDoneKg !== null ? Number(log.weightDoneKg) : null,
      })),
    );
    const recordsBySession = new Map<string, number>();
    for (const record of records) {
      recordsBySession.set(record.sessionId, (recordsBySession.get(record.sessionId) ?? 0) + 1);
    }
    return recordsBySession;
  }

  async readPersonalRecords(context: AuthContext, query: PersonalRecordsQuery): Promise<PersonalRecord[]> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const priorRows = await this.prisma.$queryRaw<Array<{ best_e1rm: number; exercise_id: string }>>`
      SELECT i.source_exercise_id AS exercise_id,
             MAX(
               CASE
                 WHEN l.weight_done_kg > 0 AND l.reps_done > 0 AND (l.effort_rir IS NOT NULL OR l.effort_rpe IS NOT NULL)
                  AND (1.0278 - 0.0278 * (
                    l.reps_done + COALESCE(l.effort_rir, GREATEST(0, 10 - l.effort_rpe))
                  )) > 0
                 THEN ROUND((
                   l.weight_done_kg / (1.0278 - 0.0278 * (
                     l.reps_done + COALESCE(l.effort_rir, GREATEST(0, 10 - l.effort_rpe))
                   ))
                 )::numeric, 2)
                 ELSE NULL
               END
             )::float8 AS best_e1rm
      FROM set_log l
      JOIN session_strength_item i ON i.id = l.session_item_id
      JOIN session_instance s ON s.id = l.session_id
      WHERE s.client_id = ${clientId}::uuid
        AND s.archived_at IS NULL
        AND (s.is_incomplete = true OR s.is_completed = true OR s.status = 'COMPLETED')
        AND s.session_date < ${query.from}::date
        AND i.source_exercise_id IS NOT NULL
      GROUP BY i.source_exercise_id
    `;
    const priorBest = new Map<string, number>();
    for (const row of priorRows) {
      if (row.best_e1rm !== null) priorBest.set(row.exercise_id, Number(row.best_e1rm));
    }
    const logs = await this.prisma.setLog.findMany({
      where: {
        session: { archivedAt: null, clientId, ...closedSessionWhere, sessionDate: { gte: query.from, lte: query.to } },
      },
      select: {
        effortRpe: true,
        effortRir: true,
        repsDone: true,
        session: { select: { sessionDate: true, ...outcomeSelect } },
        sessionId: true,
        sessionItem: { select: { displayName: true, sourceExerciseId: true } },
        weightDoneKg: true,
      },
      orderBy: [{ session: { sessionDate: 'asc' } }, { sessionId: 'asc' }, { setIndex: 'asc' }],
    });
    return collectBrokenRecords(
      priorBest,
      logs.map((log) => ({
        effortRpe: toRpeNumber(log.effortRpe),
        effortRir: log.effortRir,
        exerciseId: log.sessionItem?.sourceExerciseId ?? null,
        exerciseName: log.sessionItem?.displayName ?? '',
        repsDone: log.repsDone,
        sessionDate: log.session.sessionDate.toISOString().slice(0, 10),
        sessionId: log.sessionId,
        weightDoneKg: log.weightDoneKg !== null ? Number(log.weightDoneKg) : null,
      })),
    ).map((record) => ({
      e1rm: record.e1rm,
      exerciseId: record.exerciseId,
      exerciseName: record.exerciseName,
      previousBest: record.previousBest,
      sessionDate: record.sessionDate,
      sessionId: record.sessionId,
    }));
  }

  async readRecentSessions(context: AuthContext, query: RecentSessionsQuery): Promise<RecentSessionSummary[]> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const whereBase: Prisma.SessionInstanceWhereInput = {
      archivedAt: null,
      clientId,
      ...closedSessionWhere,
      sessionDate: { gte: query.from, lte: query.to },
      ...(query.templateId ? { sourceTemplateId: query.templateId } : {}),
    };

    delete whereBase.OR;
    if (query.dayIndex != null) whereBase.planDayIndex = query.dayIndex;
    if (query.category) {
      const relation = {
        strength: 'items',
        cardio: 'cardioBlocks',
        plio: 'plioBlocks',
        mobility: 'mobilityBlocks',
        isometric: 'isometricBlocks',
        sport: 'sportBlocks',
      } as const;
      Object.assign(whereBase, { [relation[query.category]]: { some: { archivedAt: null } } });
    }
    const sessions = await this.prisma.sessionInstance.findMany({
      where: {
        ...whereBase,
        AND: [
          ...(query.beforeDate && query.beforeId
            ? [
                {
                  OR: [
                    { sessionDate: { lt: query.beforeDate } },
                    { sessionDate: query.beforeDate, id: { lt: query.beforeId } },
                  ],
                },
              ]
            : []),
          ...(query.exerciseId
            ? [
                {
                  OR: [
                    { items: { some: { sourceExerciseId: query.exerciseId, archivedAt: null } } },
                    { cardioBlocks: { some: { sourceCardioMethodId: query.exerciseId, archivedAt: null } } },
                    { plioBlocks: { some: { sourcePlioExerciseId: query.exerciseId, archivedAt: null } } },
                    { mobilityBlocks: { some: { sourceMobilityExerciseId: query.exerciseId, archivedAt: null } } },
                    { isometricBlocks: { some: { sourceIsometricExerciseId: query.exerciseId, archivedAt: null } } },
                    { sportBlocks: { some: { sourceSportId: query.exerciseId, archivedAt: null } } },
                  ],
                },
              ]
            : []),
        ],
      },
      select: sessionProgressSelect(),
      orderBy: [{ sessionDate: 'desc' }, { id: 'desc' }],
      take: query.limit,
    });
    const origins = await readSessionOrigins(this.prisma, sessions);
    return sessions.map((session) => {
      const outcome = sessionOutcome(session);
      const closed = outcome === 'done' || outcome === 'incomplete';
      const point = query.category
        ? mapCategorySessionProgressPoint(session, query.category)
        : mapLegacySessionProgressPoint(session);
      return {
        ...mapCategorySessionBase(session),
        originDate: origins.get(session.id) ?? null,
        skipReason: session.skipReason,
        exerciseCount: recordedExerciseCount(session),
        totalTonnage: closed ? point.sessionTonnage : null,
        sessionInol: closed ? point.sessionInol : null,
        avgRpe: closed ? point.sessionRpe : null,
        durationMinutes: closed ? point.durationMinutes : null,
        metricCoverage: closed ? point.metricCoverage : {},
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
    const clientId = await this.resolveClientIdWithoutClosing(context, inputClientId);
    await closeStaleSessions(this.prisma, { clientId });
    return clientId;
  }

  private async resolveClientIdWithoutClosing(context: AuthContext, inputClientId?: string): Promise<string> {
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

type StoredRpe = Prisma.Decimal | number | null;

type SessionProgressRow = {
  isCompleted: boolean;
  isIncomplete: boolean;
  status: string;
  skippedAt: Date | null;
  id: string;
  sessionDate: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  client: { fcRest: number | null; fcMax: number | null } | null;
  logs: Array<{
    sessionItemId?: string;
    repsDone: number | null;
    weightDoneKg: Prisma.Decimal | null;
    effortRpe: StoredRpe;
    effortRir?: number | null;
  }>;
  intervalLogs: Array<{
    sessionCardioBlockId?: string;
    durationSecondsDone: number | null;
    effortRpe: StoredRpe;
    avgHeartRate: number | null;
    distanceDoneMeters?: number | null;
  }>;
  plioLogs: Array<{
    sessionPlioBlockId?: string;
    repsDone: number | null;
    weightDoneKg: Prisma.Decimal | null;
    effortRpe: StoredRpe;
    effortRir?: number | null;
    durationSecondsDone?: number | null;
  }>;
  mobilityLogs: Array<{
    sessionMobilityBlockId?: string;
    effortRpe: StoredRpe;
    repsDone?: number | null;
    romDone?: string | null;
    weightDoneKg?: Prisma.Decimal | null;
  }>;
  isometricLogs: Array<{
    sessionIsometricBlockId?: string;
    durationSecondsDone: number | null;
    weightDoneKg: Prisma.Decimal | null;
    effortRpe: StoredRpe;
  }>;
  sportSetLogs?: Array<{
    sessionSportBlockId?: string;
    distanceDoneMeters: number | null;
    heartRateDone?: number | null;
    hrMaxPctDone?: number | null;
    hrReservePctDone?: number | null;
    romDone?: string | null;
    effortRir: number | null;
    durationSecondsDone: number | null;
    effortRpe: StoredRpe;
    repsDone: number | null;
    weightDoneKg: Prisma.Decimal | null;
  }>;
  sportLogs: Array<{
    sessionSportBlockId?: string;
    durationMinutesDone: number | null;
    effortRpe: StoredRpe;
    avgHeartRate: number | null;
    distanceDoneMeters?: number | null;
  }>;
};

function sessionProgressSelect() {
  return {
    id: true,
    ...outcomeSelect,
    clientId: true,
    planDayId: true,
    updatedAt: true,
    skipReason: true,
    sessionDate: true,
    startedAt: true,
    finishedAt: true,
    client: { select: { fcRest: true, fcMax: true } },
    logs: { select: { sessionItemId: true, repsDone: true, weightDoneKg: true, effortRpe: true, effortRir: true } },
    intervalLogs: {
      select: {
        sessionCardioBlockId: true,
        durationSecondsDone: true,
        effortRpe: true,
        avgHeartRate: true,
        distanceDoneMeters: true,
      },
    },
    plioLogs: {
      select: { sessionPlioBlockId: true, repsDone: true, weightDoneKg: true, effortRpe: true, durationSecondsDone: true },
    },
    mobilityLogs: {
      select: { sessionMobilityBlockId: true, effortRpe: true, repsDone: true, weightDoneKg: true, romDone: true },
    },
    isometricLogs: {
      select: { sessionIsometricBlockId: true, durationSecondsDone: true, weightDoneKg: true, effortRpe: true },
    },
    sportSetLogs: {
      select: {
        sessionSportBlockId: true,
        distanceDoneMeters: true,
        heartRateDone: true,
        hrMaxPctDone: true,
        hrReservePctDone: true,
        romDone: true,
        effortRir: true,
        durationSecondsDone: true,
        effortRpe: true,
        repsDone: true,
        weightDoneKg: true,
      },
    },
    sportLogs: { select: { sessionSportBlockId: true, durationMinutesDone: true, effortRpe: true, avgHeartRate: true } },
  };
}

function aggregateStrengthSetLogs(logs: SessionProgressRow['logs']): {
  totalTonnage: number | null;
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
    if (isRecordedNonNegative(w) && isRecordedNonNegative(r)) {
      totalTonnage += w * r;
      const e1rm = estimateE1rm(w, r, toRpeNumber(log.effortRpe), log.effortRir);
      const inol = e1rm === null ? null : calculateSetInol(w, r, e1rm);
      if (inol !== null) {
        totalInol += inol;
        inolCount++;
      }
    }
    const effortRpe = toRpeNumber(log.effortRpe);
    if (isRecordedNumber(effortRpe)) {
      totalRpe += effortRpe;
      rpeCount++;
    }
  }
  const avgRpe = rpeCount > 0 ? Math.round((totalRpe / rpeCount) * 100) / 100 : null;
  const sessionInol = inolCount > 0 ? Math.round(totalInol * 10000) / 10000 : null;
  const effortIndex = avgRpe !== null && sessionInol !== null ? Math.round(avgRpe * sessionInol * 100) / 100 : null;
  return {
    totalTonnage: logs.some(
      (log) =>
        isRecordedNonNegative(log.weightDoneKg !== null ? Number(log.weightDoneKg) : null) &&
        isRecordedNonNegative(log.repsDone),
    )
      ? Math.round(totalTonnage * 100) / 100
      : null,
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
  heartRateDurationSeconds: number;
} {
  const intervalDurationSeconds = session.intervalLogs.reduce(
    (sum, log) => sum + (isRecordedNumber(log.durationSecondsDone) ? log.durationSecondsDone : 0),
    0,
  );
  const hrRows = session.intervalLogs.filter(
    (log) => isRecordedNumber(log.avgHeartRate) && isRecordedNumber(log.durationSecondsDone),
  );
  const hrWeight = hrRows.reduce((sum, log) => sum + log.durationSecondsDone!, 0);
  const avgHr =
    hrWeight > 0
      ? Math.round(hrRows.reduce((sum, log) => sum + log.avgHeartRate! * log.durationSecondsDone!, 0) / hrWeight)
      : null;
  const rpeValues = session.intervalLogs.map((l) => toRpeNumber(l.effortRpe)).filter(isRecordedNumber);
  const avgRpe =
    rpeValues.length > 0 ? Math.round((rpeValues.reduce((s, value) => s + value, 0) / rpeValues.length) * 100) / 100 : null;
  let trainingLoad: number | null = null;
  const fcRest = session.client?.fcRest;
  const fcMax = session.client?.fcMax;
  if (avgHr !== null && fcRest != null && fcMax != null && fcMax > fcRest) {
    const total = hrRows.reduce(
      (sum, log) =>
        sum + (log.durationSecondsDone! / 60) * Math.max(0, ((log.avgHeartRate! - fcRest) / (fcMax - fcRest)) * 100),
      0,
    );
    trainingLoad = Math.round(total * 100) / 100;
  }
  return { trainingLoad, avgRpe, avgHr, intervalDurationSeconds, heartRateDurationSeconds: hrWeight };
}

function durationMinutesFromSession(session: SessionProgressRow): number | null {
  if (!session.startedAt || !session.finishedAt || session.finishedAt <= session.startedAt) return null;
  return Math.round((session.finishedAt.getTime() - session.startedAt.getTime()) / 60000);
}

function peakLoadKgFromLogs(logs: Array<{ weightDoneKg: Prisma.Decimal | null }>): number | null {
  let peak: number | null = null;
  for (const log of logs) {
    const w = log.weightDoneKg !== null ? Number(log.weightDoneKg) : null;
    if (w === null) continue;
    peak = peak === null ? w : Math.max(peak, w);
  }
  return peak;
}

function strengthE1rmStatsFromLogs(logs: SessionProgressRow['logs']): { sum: number; count: number } {
  let sum = 0;
  let count = 0;
  for (const log of logs) {
    const reps = log.repsDone;
    const weight = log.weightDoneKg !== null ? Number(log.weightDoneKg) : null;
    if (reps === null || weight === null) continue;
    const e1rm = estimateE1rm(weight, reps, toRpeNumber(log.effortRpe), log.effortRir);
    if (e1rm === null) continue;
    sum += e1rm;
    count++;
  }
  return { sum, count };
}

function avgIntensityPercentFromLogs(logs: SessionProgressRow['logs']): number | null {
  let sum = 0;
  let count = 0;
  for (const log of logs) {
    const reps = log.repsDone;
    const weight = log.weightDoneKg !== null ? Number(log.weightDoneKg) : null;
    if (reps === null || weight === null) continue;
    const e1rm = estimateE1rm(weight, reps, toRpeNumber(log.effortRpe), log.effortRir);
    if (e1rm === null || e1rm <= 0) continue;
    sum += (weight / e1rm) * 100;
    count++;
  }
  return count > 0 ? Math.round((sum / count) * 100) / 100 : null;
}

function mapLegacySessionProgressPoint(session: SessionProgressRow): SessionProgressPoint {
  const s = aggregateStrengthSetLogs(session.logs);
  const cardio = cardioTrainingFromIntervals(session);
  const durationMinutes = durationMinutesFromSession(session);
  const avgIntensityPercent = avgIntensityPercentFromLogs(session.logs);
  const peakLoadKg = peakLoadKgFromLogs(session.logs);
  const sessionEfficiency =
    cardio.avgHr !== null && cardio.avgHr > 0 && s.totalTonnage !== null && s.totalTonnage >= 0
      ? Math.round((s.totalTonnage / cardio.avgHr) * 100) / 100
      : null;
  const point: SessionProgressPoint = {
    ...mapCategorySessionBase(session),
    sessionTonnage: s.totalTonnage,
    sessionInol: s.sessionInol,
    sessionRpe: s.avgRpe,
    effortIndex: s.effortIndex,
    trainingLoad: cardio.trainingLoad,
    sessionEfficiency,
    durationMinutes,
    avgIntensityPercent,
    peakLoadKg,
  };
  return { ...point, metricCoverage: sessionMetricCoverage(session, 'legacy', point) };
}

function mapCategorySessionProgressPoint(session: SessionProgressRow, category: string): SessionProgressPoint {
  const mapper: Record<string, (session: SessionProgressRow) => SessionProgressPoint> = {
    strength: mapCategorySessionStrength,
    cardio: mapCategorySessionCardio,
    plio: mapCategorySessionPlio,
    isometric: mapCategorySessionIsometric,
    mobility: mapCategorySessionMobility,
    sport: mapCategorySessionSport,
  };
  const point = (mapper[category] ?? mapCategorySessionStrength)(session);
  return { ...point, metricCoverage: sessionMetricCoverage(session, category, point) };
}

function mapCategorySessionBase(session: SessionProgressRow) {
  return {
    sessionDate: session.sessionDate.toISOString().slice(0, 10),
    sessionId: session.id,
    outcome: sessionOutcome(session),
    hasRecordedData: sessionHasRecordedData(session),
  };
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
    durationMinutes: durationMinutesFromSession(session),
    avgIntensityPercent: avgIntensityPercentFromLogs(session.logs),
    peakLoadKg: peakLoadKgFromLogs(session.logs),
  };
}

function mapCategorySessionCardio(session: SessionProgressRow): SessionProgressPoint {
  const baseDate = mapCategorySessionBase(session);
  const c = cardioTrainingFromIntervals(session);
  const sessionEfficiency =
    c.avgHr !== null && c.avgHr > 0 && c.heartRateDurationSeconds > 0
      ? Math.round((c.heartRateDurationSeconds / c.avgHr) * 100) / 100
      : null;
  return {
    ...baseDate,
    sessionTonnage: null,
    sessionInol: null,
    sessionRpe: c.avgRpe,
    effortIndex: null,
    trainingLoad: c.trainingLoad,
    sessionEfficiency,
    durationMinutes: durationMinutesFromSession(session),
    avgIntensityPercent: null,
    peakLoadKg: null,
  };
}

function mapCategorySessionPlio(session: SessionProgressRow): SessionProgressPoint {
  const baseDate = mapCategorySessionBase(session);
  let ton = 0;
  let tonSamples = 0;
  let rpeSum = 0;
  let rpeN = 0;
  for (const log of session.plioLogs) {
    const w = log.weightDoneKg !== null ? Number(log.weightDoneKg) : null;
    const r = log.repsDone;
    if (isRecordedNonNegative(w) && isRecordedNonNegative(r)) {
      ton += w * r;
      tonSamples++;
    }
    const effortRpe = toRpeNumber(log.effortRpe);
    if (isRecordedNumber(effortRpe)) {
      rpeSum += effortRpe;
      rpeN++;
    }
  }
  const avgRpe = rpeN > 0 ? Math.round((rpeSum / rpeN) * 100) / 100 : null;
  return {
    ...baseDate,
    sessionTonnage: tonSamples > 0 ? Math.round(ton * 100) / 100 : null,
    sessionInol: null,
    sessionRpe: avgRpe,
    effortIndex: null,
    trainingLoad: null,
    sessionEfficiency: null,
    durationMinutes: durationMinutesFromSession(session),
    avgIntensityPercent: null,
    peakLoadKg: peakLoadKgFromLogs(session.plioLogs),
  };
}

function mapCategorySessionIsometric(session: SessionProgressRow): SessionProgressPoint {
  const baseDate = mapCategorySessionBase(session);
  let ton = 0;
  let tonSamples = 0;
  let rpeSum = 0;
  let rpeN = 0;
  for (const log of session.isometricLogs) {
    const w = log.weightDoneKg !== null ? Number(log.weightDoneKg) : null;
    const sec = log.durationSecondsDone;
    if (isRecordedNonNegative(w) && isRecordedNonNegative(sec)) {
      ton += w * (sec / 60);
      tonSamples++;
    }
    const effortRpe = toRpeNumber(log.effortRpe);
    if (isRecordedNumber(effortRpe)) {
      rpeSum += effortRpe;
      rpeN++;
    }
  }
  const avgRpe = rpeN > 0 ? Math.round((rpeSum / rpeN) * 100) / 100 : null;
  return {
    ...baseDate,
    sessionTonnage: tonSamples > 0 ? Math.round(ton * 100) / 100 : null,
    sessionInol: null,
    sessionRpe: avgRpe,
    effortIndex: null,
    trainingLoad: null,
    sessionEfficiency: null,
    durationMinutes: durationMinutesFromSession(session),
    avgIntensityPercent: null,
    peakLoadKg: peakLoadKgFromLogs(session.isometricLogs),
  };
}

function mapCategorySessionMobility(session: SessionProgressRow): SessionProgressPoint {
  const baseDate = mapCategorySessionBase(session);
  const rpeVals = session.mobilityLogs.map((l) => toRpeNumber(l.effortRpe)).filter((v): v is number => v !== null);
  const avgRpe = rpeVals.length > 0 ? Math.round((rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length) * 100) / 100 : null;
  return {
    ...baseDate,
    sessionTonnage: null,
    sessionInol: null,
    sessionRpe: avgRpe,
    effortIndex: null,
    trainingLoad: null,
    sessionEfficiency: null,
    durationMinutes: durationMinutesFromSession(session),
    avgIntensityPercent: null,
    peakLoadKg: null,
  };
}

function mapCategorySessionSport(session: SessionProgressRow): SessionProgressPoint {
  const records = selectRecordedSportRecords(session.sportSetLogs ?? [], session.sportLogs);
  const logs = records.sets;
  const strength = aggregateStrengthSetLogs(logs);
  const rpes = [...records.sets, ...records.legacy].map((log) => toRpeNumber(log.effortRpe)).filter(isRecordedNumber);
  const { minutes } = sportRecordedDuration(session);
  return {
    ...mapCategorySessionBase(session),
    sessionTonnage: strength.totalTonnage,
    sessionInol: strength.sessionInol,
    sessionRpe: rpes.length ? Math.round((rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length) * 100) / 100 : null,
    effortIndex: strength.effortIndex,
    trainingLoad: null,
    sessionEfficiency: null,
    durationMinutes: minutes ?? durationMinutesFromSession(session),
    avgIntensityPercent: avgIntensityPercentFromLogs(logs),
    peakLoadKg: peakLoadKgFromLogs(logs),
  };
}

function buildDateWhere(clientId: string, query: ProgressQuery) {
  return {
    session: {
      archivedAt: null,
      clientId,
      ...closedSessionWhere,
      sessionDate: { gte: query.from, lte: query.to },
    },
  };
}

function buildSessionWhere(clientId: string, query: ProgressQuery) {
  return {
    archivedAt: null,
    clientId,
    ...closedSessionWhere,
    sessionDate: { gte: query.from, lte: query.to },
  };
}

function uniqueIds(items: Array<null | string>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item)))];
}

function readDurationSeconds(
  startedAt: Date | null,
  finishedAt: Date | null,
  intervalLogs: Array<{
    sessionCardioBlockId?: string;
    durationSecondsDone: null | number;
  }>,
): null | number {
  if (startedAt && finishedAt && finishedAt > startedAt) {
    return Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
  }
  const intervalDuration = intervalLogs.reduce(
    (sum, row) => sum + (isRecordedNumber(row.durationSecondsDone) ? row.durationSecondsDone : 0),
    0,
  );
  return intervalDuration > 0 ? intervalDuration : null;
}

function readSessionEffort(
  setLogs: Array<{ effortRpe: Prisma.Decimal | null | number }>,
  intervalLogs: Array<{
    sessionCardioBlockId?: string;
    effortRpe: Prisma.Decimal | null | number;
  }>,
): null | number {
  const values = [...setLogs, ...intervalLogs]
    .map((row) => toRpeNumber(row.effortRpe))
    .filter((value): value is number => value !== null);
  if (values.length === 0) {
    return null;
  }
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(avg * 100) / 100;
}

function sessionHasRecordedData(session: SessionProgressRow): boolean {
  const numeric = <T extends { effortRpe: StoredRpe; weightDoneKg?: Prisma.Decimal | null }>(row: T) => ({
    ...row,
    effortRpe: toRpeNumber(row.effortRpe),
    weightDoneKg: row.weightDoneKg != null ? Number(row.weightDoneKg) : null,
  });
  return (
    session.logs.some((log) => strengthSetHasData(numeric(log))) ||
    session.plioLogs.some((log) => plioSetHasData(numeric(log))) ||
    session.mobilityLogs.some((log) => mobilitySetHasData(numeric(log))) ||
    session.isometricLogs.some((log) => isometricSetHasData(numeric(log))) ||
    session.intervalLogs.some((log) => cardioIntervalHasData(numeric(log))) ||
    session.sportLogs.some((log) => sportLogHasData(numeric(log))) ||
    (session.sportSetLogs ?? []).some((log) => sportSetHasData(numeric(log)))
  );
}

function sessionMetricCoverage(
  session: SessionProgressRow,
  category: string,
  point: SessionProgressPoint,
): import('../../domain/progress.models').MetricCoverage {
  type MetricLog = {
    effortRpe: StoredRpe;
    effortRir?: number | null;
    repsDone?: number | null;
    weightDoneKg?: Prisma.Decimal | null;
    durationSecondsDone?: number | null;
  };
  const sportRecords = selectRecordedSportRecords(session.sportSetLogs ?? [], session.sportLogs);
  const logs: MetricLog[] =
    category === 'cardio'
      ? session.intervalLogs
      : category === 'plio'
        ? session.plioLogs
        : category === 'isometric'
          ? session.isometricLogs
          : category === 'mobility'
            ? session.mobilityLogs
            : category === 'sport'
              ? [...sportRecords.sets, ...sportRecords.legacy]
              : session.logs;
  const weight = (log: MetricLog) => (log.weightDoneKg == null ? null : Number(log.weightDoneKg));
  const strength = category === 'strength' || category === 'legacy' || category === 'sport';
  const hasTonnage = (log: MetricLog) =>
    isRecordedNonNegative(weight(log)) &&
    (category === 'isometric' ? isRecordedNonNegative(log.durationSecondsDone) : isRecordedNonNegative(log.repsDone));
  const e1rm = (log: MetricLog) =>
    weight(log) == null || log.repsDone == null
      ? null
      : estimateE1rm(weight(log)!, log.repsDone, toRpeNumber(log.effortRpe), log.effortRir);
  const validE1rm = logs.filter((log) => e1rm(log) !== null);
  const validInol = validE1rm.filter((log) => calculateSetInol(weight(log)!, log.repsDone!, e1rm(log)!) !== null);
  const intervals = category === 'cardio' || category === 'legacy' ? session.intervalLogs : [];
  const profileValid =
    session.client?.fcMax != null && session.client?.fcRest != null && session.client.fcMax > session.client.fcRest;
  const weighted = profileValid
    ? intervals.filter((log) => isRecordedNumber(log.avgHeartRate) && isRecordedNumber(log.durationSecondsDone))
    : [];
  const samples = (
    validSamples: number,
    eligibleSamples = logs.length,
    unit: 'sets' | 'intervals' | 'sessions' = category === 'cardio' || category === 'sport' ? 'intervals' : 'sets',
  ) => ({ validSamples, eligibleSamples, unit });
  return {
    sessionRpe: samples(logs.filter((log) => isRecordedNumber(toRpeNumber(log.effortRpe))).length),
    sessionTonnage: samples(
      category === 'cardio' || category === 'mobility' ? 0 : logs.filter(hasTonnage).length,
      category === 'cardio' || category === 'mobility' ? 0 : logs.length,
    ),
    sessionInol: samples(strength ? validInol.length : 0, strength ? logs.length : 0),
    avgIntensityPercent: samples(strength ? validE1rm.length : 0, strength ? logs.length : 0),
    peakLoadKg: samples(logs.filter((log) => isRecordedNonNegative(weight(log))).length),
    effortIndex: samples(point.effortIndex === null ? 0 : 1, 1, 'sessions'),
    sessionEfficiency: samples(point.sessionEfficiency === null ? 0 : 1, 1, 'sessions'),
    trainingLoad: {
      ...samples(weighted.length, intervals.length, 'intervals'),
      weightSeconds: weighted.reduce((sum, log) => sum + log.durationSecondsDone!, 0),
    },
    durationMinutes:
      category === 'sport' && (sportRecordedDuration(session).minutes !== null || point.durationMinutes === null)
        ? sportRecordedDuration(session).coverage
        : samples(point.durationMinutes === null ? 0 : 1, 1, 'sessions'),
  };
}

function recordedExerciseCount(session: SessionProgressRow): number {
  const ids = new Set<string>();
  const numeric = <T extends { effortRpe: StoredRpe; weightDoneKg?: Prisma.Decimal | null }>(row: T) => ({
    ...row,
    effortRpe: toRpeNumber(row.effortRpe),
    weightDoneKg: row.weightDoneKg == null ? null : Number(row.weightDoneKg),
  });
  const count = <T>(rows: T[], type: string, blockId: (row: T) => string | undefined, hasData: (row: T) => boolean) => {
    for (const row of rows) {
      const id = blockId(row);
      if (id && hasData(row)) ids.add(`${type}:${id}`);
    }
  };
  count(
    session.logs,
    'strength',
    (row) => row.sessionItemId,
    (row) => strengthSetHasData(numeric(row)),
  );
  count(
    session.intervalLogs,
    'cardio',
    (row) => row.sessionCardioBlockId,
    (row) => cardioIntervalHasData(numeric(row)),
  );
  count(
    session.plioLogs,
    'plio',
    (row) => row.sessionPlioBlockId,
    (row) => plioSetHasData(numeric(row)),
  );
  count(
    session.mobilityLogs,
    'mobility',
    (row) => row.sessionMobilityBlockId,
    (row) => mobilitySetHasData(numeric(row)),
  );
  count(
    session.isometricLogs,
    'isometric',
    (row) => row.sessionIsometricBlockId,
    (row) => isometricSetHasData(numeric(row)),
  );
  count(
    session.sportLogs,
    'sport',
    (row) => row.sessionSportBlockId,
    (row) => sportLogHasData(numeric(row)),
  );
  count(
    session.sportSetLogs ?? [],
    'sport',
    (row) => row.sessionSportBlockId,
    (row) => sportSetHasData(numeric(row)),
  );
  return ids.size;
}

function sportRecordedDuration(session: SessionProgressRow) {
  const { sets, legacy } = selectRecordedSportRecords(session.sportSetLogs ?? [], session.sportLogs);
  const durations = [
    ...sets.map((row) => (row.durationSecondsDone === null ? null : row.durationSecondsDone / 60)),
    ...legacy.map((row) => row.durationMinutesDone),
  ];
  const valid = durations.filter(isRecordedNonNegative);
  return {
    minutes: valid.length ? valid.reduce((sum, value) => sum + value, 0) : null,
    coverage: { validSamples: valid.length, eligibleSamples: durations.length, unit: 'intervals' as const },
  };
}

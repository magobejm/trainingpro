import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  ExerciseProgressQuery,
  MicrocycleProgressQuery,
  PerformedExercisesQuery,
  ProgressQuery,
  ProgressRepositoryPort,
  RecentSessionsQuery,
  SessionProgressQuery,
} from '../../domain/progress-repository.port';
import type {
  CardioLogRow,
  ExerciseProgressPoint,
  MicrocycleProgressPoint,
  PerformedExercisesResult,
  RecentSessionSummary,
  SessionProgressPoint,
  SessionSrpeRow,
  StrengthLogRow,
} from '../../domain/progress.models';
import { aggregateExerciseSets } from '../../domain/metrics/exercise-metrics';
import { toWeekStart } from '../../domain/metrics/week-start';
import {
  fetchPerformedExerciseNames,
  readCardioExerciseProgress,
  readIsometricProgress,
  readMobilityProgress,
  readPerformedIds,
  readPlioProgress,
  readSportProgress,
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
    const type = query.exerciseType ?? 'strength';
    if (type === 'plio') return readPlioProgress(this.prisma, clientId, query);
    if (type === 'mobility') return readMobilityProgress(this.prisma, clientId, query);
    if (type === 'isometric') return readIsometricProgress(this.prisma, clientId, query);
    if (type === 'sport') return readSportProgress(this.prisma, clientId, query);
    if (type === 'cardio') return readCardioExerciseProgress(this.prisma, clientId, query);
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

  async readSessionProgress(context: AuthContext, query: SessionProgressQuery): Promise<SessionProgressPoint[]> {
    const clientId = await this.resolveClientId(context, query.clientId);
    const sessions = await this.prisma.sessionInstance.findMany({
      where: {
        archivedAt: null,
        clientId,
        isCompleted: true,
        sourceTemplateId: query.templateId,
        sessionDate: { gte: query.from, lte: query.to },
      },
      select: {
        id: true,
        sessionDate: true,
        startedAt: true,
        finishedAt: true,
        logs: {
          select: {
            repsDone: true,
            weightDoneKg: true,
            effortRpe: true,
          },
        },
        intervalLogs: {
          select: {
            durationSecondsDone: true,
            effortRpe: true,
            avgHeartRate: true,
          },
        },
        client: { select: { fcRest: true, fcMax: true } },
      },
      orderBy: { sessionDate: 'asc' },
    });

    return sessions.map((session) => {
      let totalTonnage = 0;
      let totalInol = 0;
      let inolCount = 0;
      let totalRpe = 0;
      let rpeCount = 0;

      for (const log of session.logs) {
        const w = log.weightDoneKg !== null ? Number(log.weightDoneKg) : null;
        const r = log.repsDone;
        if (w !== null && r !== null) {
          totalTonnage += w * r;
          // Simple INOL estimate: reps / (100 - intensity) using 75% as default intensity when no e1RM
          const inol = r / 25;
          totalInol += inol;
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

      // TRIMP (simplified): duration * %FC reserva
      let trainingLoad: number | null = null;
      let sessionEfficiency: number | null = null;
      const intervalDuration = session.intervalLogs.reduce((sum, l) => sum + (l.durationSecondsDone ?? 0), 0);
      const durationMinutes = intervalDuration > 0 ? intervalDuration / 60 : null;
      const avgHr =
        session.intervalLogs.length > 0
          ? session.intervalLogs.filter((l) => l.avgHeartRate !== null).reduce((s, l) => s + (l.avgHeartRate ?? 0), 0) /
            session.intervalLogs.filter((l) => l.avgHeartRate !== null).length
          : null;

      if (durationMinutes !== null && avgHr !== null) {
        const fcRest = session.client?.fcRest ?? 60;
        const fcMax = session.client?.fcMax ?? 190;
        const fcReservePercent = ((avgHr - fcRest) / (fcMax - fcRest)) * 100;
        trainingLoad = Math.round(durationMinutes * Math.max(0, fcReservePercent) * 100) / 100;
        sessionEfficiency = avgHr > 0 ? Math.round((totalTonnage / avgHr) * 100) / 100 : null;
      }

      return {
        sessionDate: session.sessionDate.toISOString().slice(0, 10),
        sessionId: session.id,
        sessionTonnage: Math.round(totalTonnage * 100) / 100,
        sessionInol,
        sessionRpe: avgRpe,
        effortIndex,
        trainingLoad,
        sessionEfficiency,
      };
    });
  }

  async readMicrocycleProgress(context: AuthContext, query: MicrocycleProgressQuery): Promise<MicrocycleProgressPoint[]> {
    const sessionPoints = await this.readSessionProgress(context, {
      clientId: query.clientId,
      templateId: query.templateId,
      from: query.from,
      to: query.to,
    });

    type WeekAccumulator = MicrocycleProgressPoint & { _rpeSum: number; _rpeCount: number };
    const byWeek = new Map<string, WeekAccumulator>();
    for (const point of sessionPoints) {
      const weekStart = toWeekStart(new Date(point.sessionDate));
      const current: WeekAccumulator = byWeek.get(weekStart) ?? {
        weekStart,
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
      current.totalTrainingLoad = (current.totalTrainingLoad ?? 0) + (point.trainingLoad ?? 0) || null;
      current.sessionsCount++;
      current.avgRpe = current._rpeCount > 0 ? Math.round((current._rpeSum / current._rpeCount) * 100) / 100 : null;
      byWeek.set(weekStart, current);
    }

    return [...byWeek.values()]
      .map(({ weekStart, totalTonnage, avgRpe, totalTrainingLoad, sessionsCount }) => ({
        weekStart,
        totalTonnage,
        avgRpe,
        totalTrainingLoad: totalTrainingLoad !== null ? Math.round(totalTrainingLoad * 100) / 100 : null,
        sessionsCount,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
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

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ProgressQuery, ProgressRepositoryPort } from '../../domain/progress-repository.port';
import type { CardioLogRow, SessionSrpeRow, StrengthLogRow } from '../../domain/progress.models';

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

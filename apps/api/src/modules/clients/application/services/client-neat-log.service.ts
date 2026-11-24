import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { sessionDateKey } from '@trainerpro/shared';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { adherenceCutoff } from '../../../../common/plan/workout-adherence';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { clientNeatTemplateIds, neatGoalDays } from '../../../plans/infra/prisma/client-routine.prisma';
import { GetClientMeUseCase } from '../use-cases/get-client-me.usecase';
import { inclusiveDayCount, neatAdherence, type NeatAdherence } from '../neat-adherence';

type SaveNeatLog = { done: boolean; value?: number | null };

@Injectable()
export class ClientNeatLogService {
  constructor(
    private readonly getClientMeUseCase: GetClientMeUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async listMine(context: AuthContext, date: string) {
    const client = await this.getClientMeUseCase.execute(context);
    const rows = await this.prisma.clientNeatLog.findMany({
      where: { clientId: client.id, date: utcDate(date) },
    });
    return { logs: rows.map(toView) };
  }

  async saveMine(context: AuthContext, neatId: string, date: string, body: SaveNeatLog) {
    const client = await this.getClientMeUseCase.execute(context);
    const templateIds = await clientNeatTemplateIds(this.prisma, client.id);
    if (client.trainingPlanId) templateIds.push(client.trainingPlanId);
    const neat = await this.prisma.planTemplateNeat.findFirst({
      where: { archivedAt: null, id: neatId, templateId: { in: templateIds } },
    });
    if (!neat) throw new NotFoundException('NEAT goal not found');
    const row = await this.prisma.clientNeatLog.upsert({
      where: { clientId_neatId_date: { clientId: client.id, date: utcDate(date), neatId } },
      create: {
        clientId: client.id,
        date: utcDate(date),
        done: body.done,
        id: randomUUID(),
        neatId,
        value: body.value ?? null,
      },
      update: { done: body.done, value: body.value ?? null },
    });
    return toView(row);
  }
}

export function readNeatAdherence(
  prisma: PrismaService,
  clientId: string,
  from: Date,
  to: Date,
  timezoneOffset?: number,
): Promise<NeatAdherence> {
  return countNeatAdherence(prisma, clientId, from, to, timezoneOffset);
}

async function countNeatAdherence(
  prisma: PrismaService,
  clientId: string,
  from: Date,
  to: Date,
  timezoneOffset?: number,
): Promise<NeatAdherence> {
  const client = await prisma.client.findFirst({
    select: { activeRoutineAssignment: { select: { appliedAt: true } }, createdAt: true, trainingPlanId: true },
    where: { archivedAt: null, id: clientId },
  });
  const fromKey = effectiveNeatStart(sessionDateKey(from), client?.createdAt, client?.activeRoutineAssignment?.appliedAt);
  const cutoff = adherenceCutoff(sessionDateKey(to), new Date(), timezoneOffset);
  const days = inclusiveDayCount(fromKey, cutoff);
  const copyGoalDays = days > 0 ? await neatGoalDays(prisma, clientId, fromKey, cutoff) : 0;
  const goals =
    copyGoalDays != null
      ? null
      : client?.trainingPlanId
        ? await prisma.planTemplateNeat.count({ where: { archivedAt: null, templateId: client.trainingPlanId } })
        : 0;
  const done = await prisma.clientNeatLog.count({
    where: { clientId, done: true, date: { gte: utcDate(fromKey), lte: utcDate(cutoff) } },
  });
  return neatAdherence(done, copyGoalDays ?? (goals ?? 0) * days);
}

/** El NEAT solo se espera desde el alta del cliente o la asignación de su rutina, lo que sea más tarde. */
export function effectiveNeatStart(
  fromKey: string,
  createdAt: Date | null | undefined,
  appliedAt: Date | null | undefined,
): string {
  const keys = [fromKey, createdAt?.toISOString().slice(0, 10), appliedAt?.toISOString().slice(0, 10)];
  return keys.reduce<string>((latest, key) => (key && key > latest ? key : latest), fromKey);
}

function utcDate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function toView(row: { date: Date; done: boolean; neatId: string; value: { toString(): string } | null }) {
  return {
    date: row.date.toISOString().slice(0, 10),
    done: row.done,
    neatId: row.neatId,
    value: row.value == null ? null : Number(row.value.toString()),
  };
}

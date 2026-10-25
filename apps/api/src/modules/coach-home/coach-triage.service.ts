import { Injectable } from '@nestjs/common';
import { IncidentStatus } from '@prisma/client';
import { daysSinceActivity } from '../clients/domain/client-status';
import { resolveCoachMembership } from '../clients/infra/prisma/client.repository.prisma.ops';
import { readLastClientActivities } from '../clients/infra/prisma/client-last-activity.prisma';
import { isHighMorningCheckin, isRiskClient } from '@trainerpro/shared';
import type { AuthContext } from '../../common/auth-context/auth-context';
import { PrismaService } from '../../common/prisma/prisma.service';

const WEEK_SESSIONS = 4;

@Injectable()
export class CoachTriageService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: AuthContext) {
    const membership = await resolveCoachMembership(context, this.prisma);
    const today = dateOnly(new Date());
    const weekStart = new Date(today);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    const clients = await this.prisma.client.findMany({
      select: { firstName: true, id: true, lastName: true, trainingPlanId: true },
      where: { archivedAt: null, coachMembershipId: membership.id },
    });
    const ids = clients.map((client) => client.id);
    const [activity, sessions, checkins, incidents, reports, calls] = await Promise.all([
      readLastClientActivities(this.prisma, ids),
      this.prisma.sessionInstance.groupBy({
        _count: { id: true },
        by: ['clientId'],
        where: { archivedAt: null, clientId: { in: ids }, finishedAt: { gte: weekStart }, isCompleted: true },
      }),
      this.prisma.dailyCheckin.findMany({ where: { coachMembershipId: membership.id, date: today } }),
      this.prisma.incident.findMany({
        orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
        take: 30,
        where: { archivedAt: null, coachMembershipId: membership.id, coachResponse: null, status: IncidentStatus.OPEN },
      }),
      this.prisma.weeklyReport.findMany({
        orderBy: { weekStartDate: 'desc' },
        take: 30,
        where: { coachMembershipId: membership.id, reviewedAt: null },
      }),
      this.prisma.callProposal.findMany({
        where: { coachMembershipId: membership.id, date: today, status: { in: ['pending', 'accepted'] } },
      }),
    ]);
    const names = new Map(clients.map((client) => [client.id, `${client.firstName} ${client.lastName}`.trim()]));
    const completed = new Map(sessions.map((row) => [row.clientId, row._count.id]));
    return {
      atRisk: clients.flatMap((client) => riskRow(client, activity.get(client.id) ?? null, completed.get(client.id) ?? 0)),
      calls: calls.map((call) => ({
        clientId: call.clientId,
        id: call.id,
        name: names.get(call.clientId) ?? '',
        status: call.status,
        time: call.proposedTime,
      })),
      checkins: checkins.flatMap((row) => {
        if (!isHighMorningCheckin(row)) return [];
        return [
          {
            clientId: row.clientId,
            fatigue: row.fatigue,
            name: names.get(row.clientId) ?? '',
            pain: row.pain,
            recovery: row.recovery,
          },
        ];
      }),
      incidents: incidents.map((incident) => ({
        clientId: incident.clientId,
        createdAt: incident.createdAt.toISOString(),
        id: incident.id,
        name: names.get(incident.clientId) ?? '',
        severity: incident.severity,
      })),
      reports: reports.map((report) => ({
        clientId: report.clientId,
        id: report.id,
        name: names.get(report.clientId) ?? '',
        weekStart: report.weekStartDate.toISOString().slice(0, 10),
      })),
    };
  }
}

function riskRow(
  client: { firstName: string; id: string; lastName: string; trainingPlanId: string | null },
  last: Date | null,
  completed: number,
) {
  const inactiveDays = daysSinceActivity(last, new Date());
  const adherence = client.trainingPlanId ? completed / WEEK_SESSIONS : null;
  if (!isRiskClient({ adherence, inactiveDays })) return [];
  return [
    {
      adherence,
      clientId: client.id,
      inactiveDays,
      name: `${client.firstName} ${client.lastName}`.trim(),
    },
  ];
}

function dateOnly(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

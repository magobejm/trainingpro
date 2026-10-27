import { Injectable } from '@nestjs/common';
import { IncidentStatus } from '@prisma/client';
import { isLowAdherence, lowCheckinFields } from '@trainerpro/shared';
import { resolveCoachMembership } from '../clients/infra/prisma/client.repository.prisma.ops';
import type { AuthContext } from '../../common/auth-context/auth-context';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';
import {
  dateOnly,
  readAdherenceSignals,
  readClientsWithoutNutrition,
  readRoutineAlerts,
  readUnreadChats,
} from './coach-home-signals.prisma';

export const TRIAGE_CATEGORIES = [
  'chat',
  'incidents',
  'calls',
  'mood',
  'adherence',
  'reports',
  'wearables',
  'routines',
  'nutrition',
] as const;

@Injectable()
export class CoachTriageService {
  constructor(
    private readonly integrations: IntegrationsService,
    private readonly prisma: PrismaService,
  ) {}

  async setCollapsed(context: AuthContext, collapsed: string[]) {
    const membership = await resolveCoachMembership(context, this.prisma);
    const valid = TRIAGE_CATEGORIES.filter((id) => collapsed.includes(id));
    await this.prisma.organizationMember.update({ data: { coachHomeCollapsed: valid }, where: { id: membership.id } });
    return { collapsed: valid };
  }

  async execute(context: AuthContext) {
    const membership = await resolveCoachMembership(context, this.prisma);
    const now = new Date();
    const today = dateOnly(now);
    const clients = await this.prisma.client.findMany({
      select: { activeRoutineAssignmentId: true, firstName: true, id: true, lastName: true, trainingPlanId: true },
      where: { archivedAt: null, coachMembershipId: membership.id },
    });
    const ids = clients.map((client) => client.id);
    const [chat, adherence, checkins, incidents, reports, calls, routines, noNutrition, member] = await Promise.all([
      readUnreadChats(this.prisma, membership.id, ids),
      readAdherenceSignals(this.prisma, clients, now),
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
      readRoutineAlerts(this.prisma, clients, now),
      readClientsWithoutNutrition(this.prisma, ids),
      this.prisma.organizationMember.findUnique({
        select: { coachHomeCollapsed: true },
        where: { id: membership.id },
      }),
    ]);
    const names = new Map(clients.map((client) => [client.id, `${client.firstName} ${client.lastName}`.trim()]));
    const nameOf = (id: string) => names.get(id) ?? '';
    return {
      adherence: [...adherence].flatMap(([clientId, signal]) =>
        isLowAdherence(signal) ? [{ clientId, ...signal, name: nameOf(clientId) }] : [],
      ),
      calls: calls.map((call) => ({
        clientId: call.clientId,
        id: call.id,
        name: nameOf(call.clientId),
        status: call.status,
        time: call.proposedTime,
      })),
      chat: chat.map((row) => ({ ...row, name: nameOf(row.clientId) })).sort((a, b) => a.since.localeCompare(b.since)),
      collapsed: member?.coachHomeCollapsed ?? [],
      incidents: incidents.map((incident) => ({
        clientId: incident.clientId,
        createdAt: incident.createdAt.toISOString(),
        id: incident.id,
        name: nameOf(incident.clientId),
        severity: incident.severity,
      })),
      mood: checkins.flatMap((row) => {
        const fields = lowCheckinFields(row);
        return fields.length
          ? [
              {
                clientId: row.clientId,
                fields,
                motivation: row.motivation,
                name: nameOf(row.clientId),
                pain: row.pain,
                recovery: row.recovery,
                sleep: row.sleep,
              },
            ]
          : [];
      }),
      nutrition: noNutrition.map((clientId) => ({ clientId, name: nameOf(clientId) })),
      reports: reports.map((report) => ({
        clientId: report.clientId,
        id: report.id,
        name: nameOf(report.clientId),
        weekStart: report.weekStartDate.toISOString().slice(0, 10),
      })),
      routines: routines.map((row) => ({ ...row.alert, clientId: row.clientId, name: nameOf(row.clientId) })),
      wearableSignals: (await this.integrations.signalsFor(ids)).map((signal) => ({
        ...signal,
        name: nameOf(signal.clientId),
      })),
    };
  }
}

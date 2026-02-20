import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IncidentActionType, IncidentSeverity, IncidentStatus, Prisma, Role } from '@prisma/client';
import { buildCreateAuditFields, buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { IncidentListQuery, CreateIncidentInput } from '../../domain/incident.input';
import type { IncidentActionView, IncidentView } from '../../domain/incident.entity';
import type { IncidentsRepositoryPort } from '../../domain/incidents.repository.port';
import { mapAction, mapIncident, mustAlertCoach } from './incident-prisma.mappers';

@Injectable()
export class IncidentsRepositoryPrisma implements IncidentsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async addAdjustmentDraft(
    context: AuthContext,
    incidentId: string,
    draft: string,
  ): Promise<IncidentView> {
    const incident = await this.readCoachIncident(context, incidentId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.incident.update({
        where: { id: incident.id },
        data: { adjustmentDraft: draft, ...buildUpdateAuditFields(context) },
      });
      await tx.incidentAction.create({
        data: {
          actionType: IncidentActionType.ADJUSTMENT_DRAFTED,
          createdBy: context.subject,
          incidentId,
        },
      });
      return row;
    });
    return mapIncident(updated);
  }

  async addCoachResponse(
    context: AuthContext,
    incidentId: string,
    response: string,
  ): Promise<IncidentView> {
    const incident = await this.readCoachIncident(context, incidentId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.incident.update({
        where: { id: incident.id },
        data: {
          coachResponse: response,
          reviewedAt: incident.reviewedAt ?? new Date(),
          status: IncidentStatus.REVIEWED,
          ...buildUpdateAuditFields(context),
        },
      });
      await tx.incidentAction.create({
        data: { actionType: IncidentActionType.RESPONDED, createdBy: context.subject, incidentId },
      });
      return row;
    });
    return mapIncident(updated);
  }

  async addTag(context: AuthContext, incidentId: string, tag: string): Promise<IncidentView> {
    const incident = await this.readCoachIncident(context, incidentId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.incident.update({
        where: { id: incident.id },
        data: { tag, ...buildUpdateAuditFields(context) },
      });
      await tx.incidentAction.create({
        data: {
          actionType: IncidentActionType.TAGGED,
          createdBy: context.subject,
          incidentId,
          payloadJson: { tag },
        },
      });
      return row;
    });
    return mapIncident(updated);
  }

  async createIncident(context: AuthContext, input: CreateIncidentInput): Promise<IncidentView> {
    const client = await this.readClientForContext(context);
    await this.assertSessionLink(client.id, input.sessionId, input.sessionItemId);
    const coachAlertedAt = this.readAlertDate(input.severity);
    const incidentData = this.buildCreateData(context, input, client, coachAlertedAt);
    const created = await this.prisma.$transaction(async (tx) => {
      const incident = await tx.incident.create({ data: incidentData });
      if (coachAlertedAt) {
        await this.createAlertAction(tx, context.subject, incident.id, input.severity);
      }
      return incident;
    });
    return mapIncident(created);
  }

  async listActions(context: AuthContext, incidentId: string): Promise<IncidentActionView[]> {
    await this.readIncidentForContext(context, incidentId);
    const rows = await this.prisma.incidentAction.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapAction);
  }

  async listIncidents(context: AuthContext, query: IncidentListQuery): Promise<IncidentView[]> {
    const rows = await this.prisma.incident.findMany({
      where: await this.buildListWhere(context, query),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapIncident);
  }

  async markReviewed(context: AuthContext, incidentId: string): Promise<IncidentView> {
    const incident = await this.readCoachIncident(context, incidentId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.incident.update({
        where: { id: incident.id },
        data: {
          reviewedAt: incident.reviewedAt ?? new Date(),
          status: IncidentStatus.REVIEWED,
          ...buildUpdateAuditFields(context),
        },
      });
      await tx.incidentAction.create({
        data: { actionType: IncidentActionType.REVIEWED, createdBy: context.subject, incidentId },
      });
      return row;
    });
    return mapIncident(updated);
  }

  private async assertSessionLink(
    clientId: string,
    sessionId?: null | string,
    sessionItemId?: null | string,
  ): Promise<void> {
    if (!sessionId && !sessionItemId) {
      return;
    }
    if (sessionId) {
      const session = await this.prisma.sessionInstance.findFirst({
        where: { archivedAt: null, clientId, id: sessionId },
        select: { id: true },
      });
      if (!session) {
        throw new ForbiddenException('Session link does not belong to current client');
      }
    }
    if (sessionItemId) {
      const item = await this.prisma.sessionStrengthItem.findFirst({
        where: { archivedAt: null, id: sessionItemId, session: { clientId } },
        select: { id: true },
      });
      if (!item) {
        throw new ForbiddenException('Session item link does not belong to current client');
      }
    }
  }

  private async buildListWhere(context: AuthContext, query: IncidentListQuery) {
    if (context.activeRole === 'coach') {
      return this.buildCoachListWhere(context, query);
    }
    if (context.activeRole === 'client') {
      const client = await this.readClientByEmail(context.email ?? '');
      return {
        archivedAt: null,
        clientId: client.id,
        status: query.status,
      };
    }
    throw new ForbiddenException('Admin cannot access incidents');
  }

  private async buildCoachListWhere(context: AuthContext, query: IncidentListQuery) {
    const membership = await this.readCoachMembership(context.subject);
    if (query.clientId) {
      await this.assertCoachClient(membership.id, query.clientId);
    }
    return {
      archivedAt: null,
      clientId: query.clientId,
      coachMembershipId: membership.id,
      status: query.status,
    };
  }

  private async readClientByEmail(email: string) {
    const client = await this.prisma.client.findFirst({
      where: { archivedAt: null, email },
      select: { coachMembershipId: true, id: true, organizationId: true },
    });
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    return client;
  }

  private readClientForContext(context: AuthContext) {
    if (context.activeRole !== 'client') {
      throw new ForbiddenException('Only client can create incidents');
    }
    return this.readClientByEmail(context.email ?? '');
  }

  private async readCoachIncident(context: AuthContext, incidentId: string) {
    if (context.activeRole !== 'coach') {
      throw new ForbiddenException('Only coach can execute this action');
    }
    const membership = await this.readCoachMembership(context.subject);
    const incident = await this.prisma.incident.findFirst({
      where: { archivedAt: null, coachMembershipId: membership.id, id: incidentId },
    });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    return incident;
  }

  private async readCoachMembership(subject: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        archivedAt: null,
        isActive: true,
        role: Role.COACH,
        user: { supabaseUid: subject },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException('Coach membership not found');
    }
    return membership;
  }

  private async readIncidentForContext(context: AuthContext, incidentId: string) {
    if (context.activeRole === 'coach') {
      return this.readCoachIncident(context, incidentId);
    }
    if (context.activeRole === 'client') {
      const client = await this.readClientByEmail(context.email ?? '');
      const incident = await this.prisma.incident.findFirst({
        where: { archivedAt: null, clientId: client.id, id: incidentId },
      });
      if (!incident) {
        throw new NotFoundException('Incident not found');
      }
      return incident;
    }
    throw new ForbiddenException('Admin cannot access incidents');
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

  private buildCreateData(
    context: AuthContext,
    input: CreateIncidentInput,
    client: { coachMembershipId: string; id: string; organizationId: string },
    coachAlertedAt: Date | null,
  ) {
    return {
      ...buildCreateAuditFields(context),
      clientId: client.id,
      coachAlertedAt,
      coachMembershipId: client.coachMembershipId,
      description: input.description,
      organizationId: client.organizationId,
      sessionId: input.sessionId ?? null,
      sessionItemId: input.sessionItemId ?? null,
      severity: input.severity,
    };
  }

  private async createAlertAction(
    tx: Prisma.TransactionClient,
    subject: string,
    incidentId: string,
    severity: CreateIncidentInput['severity'],
  ): Promise<void> {
    await tx.incidentAction.create({
      data: {
        actionType: IncidentActionType.ALERTED,
        createdBy: subject,
        incidentId,
        payloadJson: { severity },
      },
    });
  }

  private readAlertDate(severity: CreateIncidentInput['severity']): Date | null {
    return mustAlertCoach(severity as IncidentSeverity) ? new Date() : null;
  }
}
